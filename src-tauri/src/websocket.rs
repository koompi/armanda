use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex, oneshot};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use url::Url;

use crate::stress_test::{TestConfig, TestResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct RoomInfo {
    pub room_id: String,
    pub client_count: u32,
    pub status: String,
    pub config: Option<TestConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TestStartInfo {
    pub start_time: u64,
    pub config: TestConfig,
}

#[derive(Debug, Serialize, Deserialize)]
struct WebSocketMessage {
    #[serde(rename = "type")]
    message_type: String,
    payload: serde_json::Value,
}

#[derive(Debug, Clone)]
pub struct WebSocketClient {
    tx: mpsc::Sender<Message>,
    connected: Arc<Mutex<bool>>,
    response_channels: Arc<Mutex<HashMap<String, oneshot::Sender<serde_json::Value>>>>,
}

impl WebSocketClient {
    pub async fn new(server_url: &str) -> Result<Self, String> {
        let url = Url::parse(server_url).map_err(|e| format!("Invalid WebSocket URL: {}", e))?;

        let (ws_stream, _) = connect_async(url)
            .await
            .map_err(|e| format!("Failed to connect to WebSocket server: {}", e))?;

        let (mut write, mut read) = ws_stream.split();

        let (tx, mut rx) = mpsc::channel::<Message>(100);
        let connected = Arc::new(Mutex::new(true));
        let response_channels = Arc::new(Mutex::new(HashMap::<String, oneshot::Sender<serde_json::Value>>::new()));

        let connected_clone = connected.clone();
        let response_channels_clone = response_channels.clone();

        // Handle outgoing messages
        tokio::spawn(async move {
            while let Some(message) = rx.recv().await {
                if write.send(message).await.is_err() {
                    let mut connected = connected_clone.lock().await;
                    *connected = false;
                    break;
                }
            }
        });

        // Handle incoming messages
        let connected_clone = connected.clone();
        tokio::spawn(async move {
            while let Some(message_result) = read.next().await {
                match message_result {
                    Ok(Message::Text(text)) => {
                        println!("Received message: {}", text);
                        if let Ok(ws_message) = serde_json::from_str::<WebSocketMessage>(&text) {
                            println!("Parsed message type: {}", ws_message.message_type);
                            let mut channels = response_channels_clone.lock().await;

                            // Check for response types
                            if ws_message.message_type.ends_with("-response") {
                                let request_type = ws_message.message_type.replace("-response", "");
                                if let Some(sender) = channels.remove(&request_type) {
                                    println!("Sending response for: {}", request_type);
                                    let _ = sender.send(ws_message.payload);
                                }
                            }
                        }
                    },
                    Ok(Message::Close(_)) => {
                        println!("WebSocket connection closed");
                        let mut connected = connected_clone.lock().await;
                        *connected = false;
                        break;
                    },
                    Err(e) => {
                        println!("WebSocket error: {:?}", e);
                        let mut connected = connected_clone.lock().await;
                        *connected = false;
                        break;
                    },
                    _ => {}
                }
            }
        });

        Ok(Self {
            tx,
            connected,
            response_channels,
        })
    }

    pub async fn is_connected(&self) -> bool {
        *self.connected.lock().await
    }

    async fn send_message_and_wait_for_response(
        &self,
        message_type: &str,
        payload: serde_json::Value
    ) -> Result<serde_json::Value, String> {
        if !self.is_connected().await {
            return Err("WebSocket is not connected".to_string());
        }

        // Create a channel to receive the response
        let (tx, rx) = oneshot::channel();

        // Store the channel in the map using the message type as the key
        {
            let mut channels = self.response_channels.lock().await;
            channels.insert(message_type.to_string(), tx);
        }

        // Create the message
        let message = serde_json::json!({
            "type": message_type,
            "payload": payload
        });

        println!("Sending message: {}", message_type);

        // Serialize and send the message
        let message_str = serde_json::to_string(&message)
            .map_err(|e| format!("Failed to serialize message: {}", e))?;

        self.tx
            .send(Message::Text(message_str))
            .await
            .map_err(|e| format!("Failed to send message: {}", e))?;

        println!("Waiting for response to: {}", message_type);

        // Wait for response with timeout
        match tokio::time::timeout(std::time::Duration::from_secs(10), rx).await {
            Ok(Ok(response)) => {
                println!("Received response for: {}", message_type);

                // Check if the response contains a success field
                let success = response.get("success")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);

                if !success {
                    let error = response.get("error")
                        .and_then(|v| v.as_str())
                        .unwrap_or("Unknown error");

                    println!("Error in response: {}", error);
                    return Err(error.to_string());
                }

                Ok(response)
            },
            Ok(Err(_)) => {
                println!("Response channel closed for: {}", message_type);
                Err("Response channel closed".to_string())
            },
            Err(_) => {
                println!("Timeout waiting for response to: {}", message_type);
                Err("Timeout waiting for response".to_string())
            },
        }
    }

    pub async fn create_room(&self) -> Result<String, String> {
        let response = self.send_message_and_wait_for_response(
            "create-room",
            serde_json::json!({})
        ).await?;

        // Success check is already done in send_message_and_wait_for_response

        let room_id = response.get("roomId")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "No room ID in response".to_string())?;

        Ok(room_id.to_string())
    }

    pub async fn join_room(&self, room_id: &str) -> Result<RoomInfo, String> {
        let response = self.send_message_and_wait_for_response(
            "join-room",
            serde_json::json!({ "roomId": room_id })
        ).await?;

        // Success check is already done in send_message_and_wait_for_response

        let room_id = response.get("roomId")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "No room ID in response".to_string())?;

        let client_count = response.get("clientCount")
            .and_then(|v| v.as_u64())
            .unwrap_or(1) as u32;

        let status = response.get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("waiting");

        let config = response.get("config")
            .and_then(|v| {
                if v.is_null() {
                    None
                } else {
                    serde_json::from_value(v.clone()).ok()
                }
            });

        Ok(RoomInfo {
            room_id: room_id.to_string(),
            client_count,
            status: status.to_string(),
            config,
        })
    }

    pub async fn configure_test(&self, config: &TestConfig) -> Result<(), String> {
        let config_json = serde_json::to_value(config)
            .map_err(|e| format!("Failed to serialize test config: {}", e))?;

        // Send the message and wait for response
        self.send_message_and_wait_for_response(
            "configure-test",
            serde_json::json!({ "config": config_json })
        ).await?;

        // Success check is already done in send_message_and_wait_for_response
        Ok(())
    }

    pub async fn start_test(&self) -> Result<(), String> {
        // Send the message and wait for response
        self.send_message_and_wait_for_response(
            "start-test",
            serde_json::json!({})
        ).await?;

        // Success check is already done in send_message_and_wait_for_response
        Ok(())
    }

    pub async fn submit_results(&self, results: &TestResult) -> Result<(), String> {
        let results_json = serde_json::to_value(results)
            .map_err(|e| format!("Failed to serialize test results: {}", e))?;

        // Send the message and wait for response
        self.send_message_and_wait_for_response(
            "submit-results",
            serde_json::json!({ "results": results_json })
        ).await?;

        // Success check is already done in send_message_and_wait_for_response
        Ok(())
    }

    pub async fn leave_room(&self) -> Result<(), String> {
        // Send the message and wait for response
        self.send_message_and_wait_for_response(
            "leave-room",
            serde_json::json!({})
        ).await?;

        // Success check is already done in send_message_and_wait_for_response
        Ok(())
    }
}

mod stress_test;
mod websocket;

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

use stress_test::{TestConfig, TestResult, run_stress_test};
use websocket::WebSocketClient;

// State management for the WebSocket client
struct WebSocketState {
    client: Arc<Mutex<Option<WebSocketClient>>>,
    current_room: Arc<Mutex<Option<String>>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ConnectResponse {
    success: bool,
    error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct RoomResponse {
    success: bool,
    room_id: Option<String>,
    error: Option<String>,
    client_count: Option<u32>,
    status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TestResponse {
    success: bool,
    error: Option<String>,
    result: Option<TestResult>,
}

// Connect to the WebSocket server
#[tauri::command]
async fn connect_to_server(
    server_url: String,
    ws_state: State<'_, WebSocketState>,
) -> Result<ConnectResponse, String> {
    match WebSocketClient::new(&server_url).await {
        Ok(client) => {
            let mut ws_client = ws_state.client.lock().await;
            *ws_client = Some(client);
            Ok(ConnectResponse {
                success: true,
                error: None,
            })
        }
        Err(e) => Ok(ConnectResponse {
            success: false,
            error: Some(e),
        }),
    }
}

// Create a new room
#[tauri::command]
async fn create_room(
    ws_state: State<'_, WebSocketState>,
) -> Result<RoomResponse, String> {
    let ws_client = ws_state.client.lock().await;

    if let Some(client) = &*ws_client {
        match client.create_room().await {
            Ok(room_id) => {
                let mut current_room = ws_state.current_room.lock().await;
                *current_room = Some(room_id.clone());

                Ok(RoomResponse {
                    success: true,
                    room_id: Some(room_id),
                    error: None,
                    client_count: Some(1),
                    status: Some("waiting".to_string()),
                })
            }
            Err(e) => Ok(RoomResponse {
                success: false,
                room_id: None,
                error: Some(e),
                client_count: None,
                status: None,
            }),
        }
    } else {
        Ok(RoomResponse {
            success: false,
            room_id: None,
            error: Some("Not connected to server".to_string()),
            client_count: None,
            status: None,
        })
    }
}

// Join an existing room
#[tauri::command]
async fn join_room(
    room_id: String,
    ws_state: State<'_, WebSocketState>,
) -> Result<RoomResponse, String> {
    let ws_client = ws_state.client.lock().await;

    if let Some(client) = &*ws_client {
        match client.join_room(&room_id).await {
            Ok(room_info) => {
                let mut current_room = ws_state.current_room.lock().await;
                *current_room = Some(room_id);

                Ok(RoomResponse {
                    success: true,
                    room_id: Some(room_info.room_id),
                    error: None,
                    client_count: Some(room_info.client_count),
                    status: Some(room_info.status),
                })
            }
            Err(e) => Ok(RoomResponse {
                success: false,
                room_id: None,
                error: Some(e),
                client_count: None,
                status: None,
            }),
        }
    } else {
        Ok(RoomResponse {
            success: false,
            room_id: None,
            error: Some("Not connected to server".to_string()),
            client_count: None,
            status: None,
        })
    }
}

// Configure a test
#[tauri::command]
async fn configure_test(
    config: TestConfig,
    ws_state: State<'_, WebSocketState>,
) -> Result<ConnectResponse, String> {
    let ws_client = ws_state.client.lock().await;

    if let Some(client) = &*ws_client {
        match client.configure_test(&config).await {
            Ok(_) => Ok(ConnectResponse {
                success: true,
                error: None,
            }),
            Err(e) => Ok(ConnectResponse {
                success: false,
                error: Some(e),
            }),
        }
    } else {
        Ok(ConnectResponse {
            success: false,
            error: Some("Not connected to server".to_string()),
        })
    }
}

// Start a test
#[tauri::command]
async fn start_test(
    ws_state: State<'_, WebSocketState>,
) -> Result<ConnectResponse, String> {
    let ws_client = ws_state.client.lock().await;

    if let Some(client) = &*ws_client {
        match client.start_test().await {
            Ok(_) => Ok(ConnectResponse {
                success: true,
                error: None,
            }),
            Err(e) => Ok(ConnectResponse {
                success: false,
                error: Some(e),
            }),
        }
    } else {
        Ok(ConnectResponse {
            success: false,
            error: Some("Not connected to server".to_string()),
        })
    }
}

// Run a stress test locally
#[tauri::command]
async fn run_test(config: TestConfig) -> Result<TestResponse, String> {
    match run_stress_test(config).await {
        Ok(result) => Ok(TestResponse {
            success: true,
            error: None,
            result: Some(result),
        }),
        Err(e) => Ok(TestResponse {
            success: false,
            error: Some(e),
            result: None,
        }),
    }
}

// Submit test results to the server
#[tauri::command]
async fn submit_results(
    results: TestResult,
    ws_state: State<'_, WebSocketState>,
) -> Result<ConnectResponse, String> {
    let ws_client = ws_state.client.lock().await;

    if let Some(client) = &*ws_client {
        match client.submit_results(&results).await {
            Ok(_) => Ok(ConnectResponse {
                success: true,
                error: None,
            }),
            Err(e) => Ok(ConnectResponse {
                success: false,
                error: Some(e),
            }),
        }
    } else {
        Ok(ConnectResponse {
            success: false,
            error: Some("Not connected to server".to_string()),
        })
    }
}

// Leave the current room
#[tauri::command]
async fn leave_room(
    ws_state: State<'_, WebSocketState>,
) -> Result<ConnectResponse, String> {
    let ws_client = ws_state.client.lock().await;

    if let Some(client) = &*ws_client {
        match client.leave_room().await {
            Ok(_) => {
                let mut current_room = ws_state.current_room.lock().await;
                *current_room = None;

                Ok(ConnectResponse {
                    success: true,
                    error: None,
                })
            }
            Err(e) => Ok(ConnectResponse {
                success: false,
                error: Some(e),
            }),
        }
    } else {
        Ok(ConnectResponse {
            success: false,
            error: Some("Not connected to server".to_string()),
        })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(WebSocketState {
            client: Arc::new(Mutex::new(None)),
            current_room: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            connect_to_server,
            create_room,
            join_room,
            configure_test,
            start_test,
            run_test,
            submit_results,
            leave_room,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

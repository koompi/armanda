use reqwest::{Client, Method};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tokio::task;
use url::Url;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TestConfig {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub requests_per_client: u32,
    pub concurrency: u32,
    pub timeout_ms: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TestResult {
    pub total_requests: u32,
    pub successful_requests: u32,
    pub failed_requests: u32,
    pub min_response_time: f64,
    pub max_response_time: f64,
    pub avg_response_time: f64,
    pub total_response_time: f64,
    pub status_codes: HashMap<String, u32>,
    pub duration: f64,
    pub throughput: f64,
    pub test_id: String,
    pub timestamp: u64,
}

impl Default for TestResult {
    fn default() -> Self {
        TestResult {
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            min_response_time: f64::MAX,
            max_response_time: 0.0,
            avg_response_time: 0.0,
            total_response_time: 0.0,
            status_codes: HashMap::new(),
            duration: 0.0,
            throughput: 0.0,
            test_id: Uuid::new_v4().to_string(),
            timestamp: chrono::Utc::now().timestamp() as u64,
        }
    }
}

pub async fn run_stress_test(config: TestConfig) -> Result<TestResult, String> {
    let client = Client::builder()
        .timeout(Duration::from_millis(config.timeout_ms as u64))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let url = Url::parse(&config.url).map_err(|e| format!("Invalid URL: {}", e))?;
    let method = match config.method.to_uppercase().as_str() {
        "GET" => Method::GET,
        "POST" => Method::POST,
        "PUT" => Method::PUT,
        "DELETE" => Method::DELETE,
        "PATCH" => Method::PATCH,
        "HEAD" => Method::HEAD,
        "OPTIONS" => Method::OPTIONS,
        _ => return Err(format!("Unsupported HTTP method: {}", config.method)),
    };

    let results = Arc::new(Mutex::new(TestResult::default()));
    let start_time = Instant::now();

    // Create a vector to hold all task handles
    let mut handles = Vec::new();

    // Spawn concurrent tasks
    for _ in 0..config.concurrency {
        let client = client.clone();
        let url = url.clone();
        let method = method.clone();
        let headers = config.headers.clone();
        let body = config.body.clone();
        let requests_per_task = config.requests_per_client / config.concurrency;
        let results = Arc::clone(&results);

        let handle = task::spawn(async move {
            for _ in 0..requests_per_task {
                let request_start = Instant::now();
                let mut req_builder = client.request(method.clone(), url.clone());

                // Add headers
                for (key, value) in &headers {
                    req_builder = req_builder.header(key, value);
                }

                // Add body if present
                if let Some(body_content) = &body {
                    req_builder = req_builder.body(body_content.clone());
                }

                // Send the request
                let response = req_builder.send().await;
                let request_duration = request_start.elapsed().as_secs_f64() * 1000.0; // in ms

                let mut results = results.lock().await;
                results.total_requests += 1;

                match response {
                    Ok(resp) => {
                        let status = resp.status();
                        let status_code = status.as_u16().to_string();

                        // Update status code count
                        *results.status_codes.entry(status_code).or_insert(0) += 1;

                        if status.is_success() {
                            results.successful_requests += 1;
                        } else {
                            results.failed_requests += 1;
                        }

                        // Update response time statistics
                        if request_duration < results.min_response_time {
                            results.min_response_time = request_duration;
                        }
                        if request_duration > results.max_response_time {
                            results.max_response_time = request_duration;
                        }
                        results.total_response_time += request_duration;
                    }
                    Err(_) => {
                        results.failed_requests += 1;
                        *results.status_codes.entry("error".to_string()).or_insert(0) += 1;
                    }
                }
            }
        });

        handles.push(handle);
    }

    // Wait for all tasks to complete
    for handle in handles {
        if let Err(e) = handle.await {
            return Err(format!("Task failed: {}", e));
        }
    }

    // Calculate final statistics
    let mut final_results = results.lock().await;
    let total_duration = start_time.elapsed().as_secs_f64() * 1000.0; // in ms
    final_results.duration = total_duration;

    if final_results.total_requests > 0 {
        final_results.avg_response_time =
            final_results.total_response_time / final_results.total_requests as f64;
        final_results.throughput = (final_results.total_requests as f64 / total_duration) * 1000.0; // requests per second
    }

    // Handle edge case where no requests were successful
    if final_results.min_response_time == f64::MAX {
        final_results.min_response_time = 0.0;
    }

    Ok(final_results.clone())
}

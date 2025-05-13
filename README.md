# Armanda

Armanda is a powerful cross-platform distributed stress testing tool designed for testing websites and collecting errors. Built with Tauri, React, and Rust, it provides a robust solution for load testing web applications across multiple machines.

![Armanda Logo](./armanda/public/tauri.svg)

## Features

- **Cross-Platform**: Runs on Windows, macOS, and Linux
- **Distributed Testing**: Coordinate multiple clients for increased load testing capacity
- **Real-time Metrics**: Monitor performance metrics during tests
- **Comprehensive Results**: Detailed reports with response times, error rates, and status codes
- **Customizable Tests**: Configure request parameters, headers, and concurrency
- **Collaborative Testing**: Join testing rooms with multiple team members

## Architecture

Armanda consists of three main components:

1. **Desktop Client**: A Tauri application with React frontend and Rust backend
2. **Coordination Server**: WebSocket server for synchronizing test execution across clients
3. **Testing Engine**: Rust-based HTTP client for efficient request handling

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.70+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/koompi/armanda.git
   cd armanda
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the coordination server:

   ```bash
   cd server
   node index.js
   ```

4. Run the desktop application:
   ```bash
   pnpm tauri dev
   ```

### Building for Production

To build the application for your current platform:

```bash
pnpm tauri build
```

## Usage

### Connecting to the Server

1. Start the application
2. Enter the WebSocket server URL (default: `ws://localhost:3001`)
3. Click "Connect"

### Creating or Joining a Room

1. After connecting, you can either:
   - Create a new testing room
   - Join an existing room by entering a Room ID

### Configuring a Test

As a room host, you can configure the test parameters:

- Target URL
- HTTP Method (GET, POST, PUT, etc.)
- Request Headers
- Request Body (for POST/PUT)
- Number of requests per client
- Concurrency level
- Request timeout

### Running Tests

1. The host starts the test
2. All clients in the room execute the test simultaneously
3. Results are collected and aggregated in real-time
4. View detailed metrics and charts after test completion

## Development

### Project Structure

```
armanda/
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── store/            # State management
│   └── App.tsx           # Main application
├── src-tauri/            # Rust backend
│   ├── src/              # Rust source code
│   │   ├── main.rs       # Entry point
│   │   ├── lib.rs        # Library code
│   │   ├── stress_test.rs # Testing engine
│   │   └── websocket.rs  # WebSocket client
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
└── server/               # Coordination server
    └── index.js          # WebSocket server
```

### Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Recharts
- **Backend**: Rust, Tauri, Tokio, Reqwest
- **Server**: Node.js, WebSocket (ws)
- **State Management**: Zustand

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) for the cross-platform framework
- [React](https://reactjs.org/) for the frontend library
- [Rust](https://www.rust-lang.org/) for the powerful backend language

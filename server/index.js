import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Store active rooms and their configurations
const rooms = new Map();
// Store client connections
const clients = new Map();
// Store test results
const testResults = new Map();

// Generate a unique client ID
let nextClientId = 1;

wss.on('connection', (ws) => {
  const clientId = `client-${nextClientId++}`;
  console.log(`Client connected: ${clientId}`);

  // Add client to the clients map
  clients.set(clientId, { ws, roomId: null });

  // Send the client their ID
  sendToClient(ws, 'connected', { clientId });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMessage(ws, clientId, data);
    } catch (error) {
      console.error('Error parsing message:', error);
      sendToClient(ws, 'error', { error: 'Invalid message format' });
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
    leaveRoom(clientId);
    clients.delete(clientId);
  });
});

// Handle incoming messages
function handleMessage(ws, clientId, data) {
  const { type, payload } = data;

  switch (type) {
    case 'create-room':
      createRoom(ws, clientId);
      break;
    case 'join-room':
      joinRoom(ws, clientId, payload.roomId);
      break;
    case 'configure-test':
      configureTest(ws, clientId, payload.config);
      break;
    case 'start-test':
      startTest(ws, clientId);
      break;
    case 'submit-results':
      submitResults(ws, clientId, payload.results);
      break;
    case 'leave-room':
      leaveRoom(clientId);
      sendToClient(ws, 'leave-room-response', { success: true });
      break;
    default:
      sendToClient(ws, 'error', { error: 'Unknown message type' });
  }
}

// Create a new room
function createRoom(ws, clientId) {
  const roomId = uuidv4();
  rooms.set(roomId, {
    id: roomId,
    host: clientId,
    clients: [clientId],
    config: null,
    status: 'waiting', // waiting, configured, running, completed
  });

  // Update client's room
  const clientData = clients.get(clientId);
  clientData.roomId = roomId;

  console.log(`Room created: ${roomId} by ${clientId}`);
  sendToClient(ws, 'create-room-response', { success: true, roomId });
}

// Join an existing room
function joinRoom(ws, clientId, roomId) {
  if (!rooms.has(roomId)) {
    sendToClient(ws, 'join-room-response', { success: false, error: 'Room not found' });
    return;
  }

  const room = rooms.get(roomId);
  room.clients.push(clientId);

  // Update client's room
  const clientData = clients.get(clientId);
  clientData.roomId = roomId;

  console.log(`Client ${clientId} joined room: ${roomId}`);

  // Notify the room about the new client
  broadcastToRoom(roomId, 'client-joined', {
    clientId,
    clientCount: room.clients.length
  });

  sendToClient(ws, 'join-room-response', {
    success: true,
    roomId,
    config: room.config,
    status: room.status,
    clientCount: room.clients.length
  });
}

// Configure a test
function configureTest(ws, clientId, config) {
  const clientData = clients.get(clientId);
  if (!clientData || !clientData.roomId) {
    sendToClient(ws, 'configure-test-response', { success: false, error: 'Not in a room' });
    return;
  }

  const room = rooms.get(clientData.roomId);
  if (room.host !== clientId) {
    sendToClient(ws, 'configure-test-response', { success: false, error: 'Only the host can configure the test' });
    return;
  }

  room.config = config;
  room.status = 'configured';

  // Notify all clients in the room about the new configuration
  broadcastToRoom(clientData.roomId, 'test-configured', config);

  console.log(`Test configured in room ${clientData.roomId}`);
  sendToClient(ws, 'configure-test-response', { success: true });
}

// Start a test
function startTest(ws, clientId) {
  const clientData = clients.get(clientId);
  if (!clientData || !clientData.roomId) {
    sendToClient(ws, 'start-test-response', { success: false, error: 'Not in a room' });
    return;
  }

  const room = rooms.get(clientData.roomId);
  if (room.host !== clientId) {
    sendToClient(ws, 'start-test-response', { success: false, error: 'Only the host can start the test' });
    return;
  }

  if (room.status !== 'configured') {
    sendToClient(ws, 'start-test-response', { success: false, error: 'Test not configured' });
    return;
  }

  room.status = 'running';

  // Initialize test results
  testResults.set(clientData.roomId, {
    startTime: Date.now(),
    clientResults: new Map(),
    aggregated: null
  });

  // Notify all clients to start the test
  broadcastToRoom(clientData.roomId, 'test-started', {
    startTime: Date.now(),
    config: room.config
  });

  console.log(`Test started in room ${clientData.roomId}`);
  sendToClient(ws, 'start-test-response', { success: true });
}

// Submit test results
function submitResults(ws, clientId, results) {
  const clientData = clients.get(clientId);
  if (!clientData || !clientData.roomId) {
    sendToClient(ws, 'submit-results-response', { success: false, error: 'Not in a room' });
    return;
  }

  const room = rooms.get(clientData.roomId);
  const testResult = testResults.get(clientData.roomId);

  if (!testResult) {
    sendToClient(ws, 'submit-results-response', { success: false, error: 'No test running' });
    return;
  }

  // Store the client's results
  testResult.clientResults.set(clientId, results);

  console.log(`Results received from ${clientId} in room ${clientData.roomId}`);

  // Check if all clients have submitted results
  if (testResult.clientResults.size === room.clients.length) {
    // Aggregate results
    const aggregatedResults = aggregateResults(testResult.clientResults);
    testResult.aggregated = aggregatedResults;
    room.status = 'completed';

    // Notify all clients about the aggregated results
    broadcastToRoom(clientData.roomId, 'test-completed', aggregatedResults);

    console.log(`Test completed in room ${clientData.roomId}`);
  }

  sendToClient(ws, 'submit-results-response', { success: true });
}

// Helper function to handle a client leaving a room
function leaveRoom(clientId) {
  const clientData = clients.get(clientId);
  if (!clientData || !clientData.roomId) return;

  const roomId = clientData.roomId;
  const room = rooms.get(roomId);

  if (room) {
    // Remove client from the room
    room.clients = room.clients.filter(id => id !== clientId);

    // If the room is empty, delete it
    if (room.clients.length === 0) {
      rooms.delete(roomId);
      testResults.delete(roomId);
      console.log(`Room deleted: ${roomId}`);
    } else if (room.host === clientId) {
      // If the host left, assign a new host
      room.host = room.clients[0];
      broadcastToRoom(roomId, 'host-changed', { newHost: room.host });
      console.log(`New host in room ${roomId}: ${room.host}`);
    }

    // Notify remaining clients
    broadcastToRoom(roomId, 'client-left', {
      clientId,
      clientCount: room.clients.length
    });
  }

  clientData.roomId = null;

  console.log(`Client ${clientId} left room: ${roomId}`);
}

// Helper function to send a message to a specific client
function sendToClient(ws, type, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

// Helper function to broadcast a message to all clients in a room
function broadcastToRoom(roomId, type, payload) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.clients.forEach(clientId => {
    const clientData = clients.get(clientId);
    if (clientData && clientData.ws.readyState === clientData.ws.OPEN) {
      clientData.ws.send(JSON.stringify({ type, payload }));
    }
  });
}

// Helper function to aggregate results from all clients
function aggregateResults(clientResults) {
  const aggregated = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalDuration: 0,
    minResponseTime: Number.MAX_SAFE_INTEGER,
    maxResponseTime: 0,
    avgResponseTime: 0,
    statusCodes: {},
    throughput: 0,
    clientCount: clientResults.size,
    timestamp: Date.now()
  };

  let totalResponseTime = 0;
  let totalRequests = 0;

  for (const [_, result] of clientResults) {
    if (!result) continue;

    aggregated.totalRequests += result.totalRequests || 0;
    aggregated.successfulRequests += result.successfulRequests || 0;
    aggregated.failedRequests += result.failedRequests || 0;

    if (result.minResponseTime && result.minResponseTime < aggregated.minResponseTime) {
      aggregated.minResponseTime = result.minResponseTime;
    }

    if (result.maxResponseTime && result.maxResponseTime > aggregated.maxResponseTime) {
      aggregated.maxResponseTime = result.maxResponseTime;
    }

    totalResponseTime += result.totalResponseTime || 0;
    totalRequests += result.totalRequests || 0;

    // Aggregate status codes
    if (result.statusCodes && typeof result.statusCodes === 'object') {
      for (const [code, count] of Object.entries(result.statusCodes)) {
        if (!aggregated.statusCodes[code]) {
          aggregated.statusCodes[code] = 0;
        }
        aggregated.statusCodes[code] += count;
      }
    }

    // Use the longest duration for total duration
    if (result.duration && result.duration > aggregated.totalDuration) {
      aggregated.totalDuration = result.duration;
    }
  }

  // Calculate average response time
  if (totalRequests > 0) {
    aggregated.avgResponseTime = totalResponseTime / totalRequests;
  }

  // Calculate throughput (requests per second)
  if (aggregated.totalDuration > 0) {
    aggregated.throughput = (aggregated.totalRequests / aggregated.totalDuration) * 1000;
  }

  return aggregated;
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Armanda coordination server running on port ${PORT}`);
});

import React, { useState } from 'react';
import useStore from '../store/useStore';

const RoomManager: React.FC = () => {
  const { isConnected, room, createRoom, joinRoom, leaveRoom } = useStore();
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await createRoom();

      if (!success) {
        setError('Failed to create room. Make sure the server is running.');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      setError('Room ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await joinRoom(roomId);

      if (!success) {
        setError('Failed to join room. Make sure the room ID is correct and the server is running.');
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    setLoading(true);
    await leaveRoom();
    setLoading(false);
  };

  if (!isConnected) {
    return null;
  }

  if (room.roomId) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Room Information</h2>
        <div className="space-y-2 mb-4">
          <p>
            <span className="font-medium">Room ID:</span> {room.roomId}
          </p>
          <p>
            <span className="font-medium">Status:</span> {room.status}
          </p>
          <p>
            <span className="font-medium">Clients:</span> {room.clientCount}
          </p>
          <p>
            <span className="font-medium">Role:</span> {room.isHost ? 'Host' : 'Client'}
          </p>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="btn btn-secondary w-full"
          disabled={loading}
        >
          {loading ? 'Leaving...' : 'Leave Room'}
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Join or Create Room</h2>
      <form onSubmit={handleJoinRoom} className="space-y-4 mb-4">
        <div>
          <label htmlFor="roomId" className="block text-sm font-medium mb-1">
            Room ID
          </label>
          <input
            id="roomId"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="input w-full"
            placeholder="Enter room ID"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </form>

      <div className="text-center my-4">
        <span className="text-gray-500">or</span>
      </div>

      <button
        onClick={handleCreateRoom}
        className="btn btn-secondary w-full"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create New Room'}
      </button>
    </div>
  );
};

export default RoomManager;

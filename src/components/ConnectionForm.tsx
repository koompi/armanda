import React, { useState } from 'react';
import useStore from '../store/useStore';

const ConnectionForm: React.FC = () => {
  const { serverUrl, setServerUrl, connectToServer, isConnected, connectionError } = useStore();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);

    try {
      await connectToServer();
    } catch (err) {
      console.error('Error connecting to server:', err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Connect to Server</h2>
      <form onSubmit={handleConnect} className="space-y-4">
        <div>
          <label htmlFor="serverUrl" className="block text-sm font-medium mb-1">
            Server URL
          </label>
          <input
            id="serverUrl"
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            className="input w-full"
            placeholder="ws://localhost:3001"
            disabled={isConnected}
          />
        </div>

        {connectionError && (
          <div className="text-red-500 text-sm">{connectionError}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isConnected || connecting}
        >
          {connecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
        </button>
      </form>
    </div>
  );
};

export default ConnectionForm;

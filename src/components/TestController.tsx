import React, { useState } from 'react';
import useStore from '../store/useStore';

const TestController: React.FC = () => {
  const { room, testConfig, startTest, runTest, submitResults } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTest = async () => {
    if (!room.isHost) return;
    
    setLoading(true);
    setError(null);
    const success = await startTest();
    setLoading(false);
    
    if (!success) {
      setError('Failed to start test');
    }
  };

  const handleRunTest = async () => {
    if (!testConfig) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await runTest(testConfig);
      
      if (result) {
        await submitResults(result);
      } else {
        setError('Failed to run test');
      }
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (!room.roomId || room.status === 'waiting') {
    return null;
  }

  if (room.status === 'configured') {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Test Ready</h2>
        <div className="space-y-2 mb-4">
          <p>
            <span className="font-medium">Target URL:</span> {testConfig?.url}
          </p>
          <p>
            <span className="font-medium">Method:</span> {testConfig?.method}
          </p>
          <p>
            <span className="font-medium">Requests Per Client:</span> {testConfig?.requests_per_client}
          </p>
          <p>
            <span className="font-medium">Concurrency:</span> {testConfig?.concurrency}
          </p>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}
        
        {room.isHost ? (
          <button
            onClick={handleStartTest}
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Test'}
          </button>
        ) : (
          <div className="text-center text-gray-500">
            Waiting for host to start the test...
          </div>
        )}
      </div>
    );
  }

  if (room.status === 'running') {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Test Running</h2>
        <div className="space-y-2 mb-4">
          <p>
            <span className="font-medium">Target URL:</span> {testConfig?.url}
          </p>
          <p>
            <span className="font-medium">Method:</span> {testConfig?.method}
          </p>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}
        
        <button
          onClick={handleRunTest}
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Running...' : 'Execute Test'}
        </button>
      </div>
    );
  }

  return null;
};

export default TestController;

import React, { useState } from 'react';
import useStore, { TestConfig } from '../store/useStore';

const TestConfigForm: React.FC = () => {
  const { room, testConfig, configureTest } = useStore();
  const [config, setConfig] = useState<TestConfig>(testConfig || {
    url: '',
    method: 'GET',
    headers: {},
    body: undefined,
    requests_per_client: 100,
    concurrency: 10,
    timeout_ms: 5000,
  });
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'requests_per_client' || name === 'concurrency' || name === 'timeout_ms') {
      setConfig({
        ...config,
        [name]: parseInt(value, 10) || 0,
      });
    } else {
      setConfig({
        ...config,
        [name]: value,
      });
    }
  };

  const handleAddHeader = () => {
    if (!headerKey.trim()) return;
    
    setConfig({
      ...config,
      headers: {
        ...config.headers,
        [headerKey]: headerValue,
      },
    });
    
    setHeaderKey('');
    setHeaderValue('');
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...config.headers };
    delete newHeaders[key];
    
    setConfig({
      ...config,
      headers: newHeaders,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.url.trim()) {
      setError('URL is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    const success = await configureTest(config);
    setLoading(false);
    
    if (!success) {
      setError('Failed to configure test');
    }
  };

  if (!room.roomId || !room.isHost || room.status === 'running') {
    return null;
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Configure Test</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-1">
            Target URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            value={config.url}
            onChange={handleChange}
            className="input w-full"
            placeholder="https://example.com"
            disabled={loading || room.status !== 'waiting'}
            required
          />
        </div>
        
        <div>
          <label htmlFor="method" className="block text-sm font-medium mb-1">
            HTTP Method
          </label>
          <select
            id="method"
            name="method"
            value={config.method}
            onChange={handleChange}
            className="input w-full"
            disabled={loading || room.status !== 'waiting'}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="requests_per_client" className="block text-sm font-medium mb-1">
            Requests Per Client
          </label>
          <input
            id="requests_per_client"
            name="requests_per_client"
            type="number"
            value={config.requests_per_client}
            onChange={handleChange}
            className="input w-full"
            min="1"
            max="10000"
            disabled={loading || room.status !== 'waiting'}
          />
        </div>
        
        <div>
          <label htmlFor="concurrency" className="block text-sm font-medium mb-1">
            Concurrency
          </label>
          <input
            id="concurrency"
            name="concurrency"
            type="number"
            value={config.concurrency}
            onChange={handleChange}
            className="input w-full"
            min="1"
            max="100"
            disabled={loading || room.status !== 'waiting'}
          />
        </div>
        
        <div>
          <label htmlFor="timeout_ms" className="block text-sm font-medium mb-1">
            Timeout (ms)
          </label>
          <input
            id="timeout_ms"
            name="timeout_ms"
            type="number"
            value={config.timeout_ms}
            onChange={handleChange}
            className="input w-full"
            min="100"
            max="60000"
            disabled={loading || room.status !== 'waiting'}
          />
        </div>
        
        {(config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH') && (
          <div>
            <label htmlFor="body" className="block text-sm font-medium mb-1">
              Request Body
            </label>
            <textarea
              id="body"
              name="body"
              value={config.body || ''}
              onChange={handleChange}
              className="input w-full h-24"
              placeholder="Request body (JSON, etc.)"
              disabled={loading || room.status !== 'waiting'}
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">Headers</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={headerKey}
              onChange={(e) => setHeaderKey(e.target.value)}
              className="input flex-1"
              placeholder="Key"
              disabled={loading || room.status !== 'waiting'}
            />
            <input
              type="text"
              value={headerValue}
              onChange={(e) => setHeaderValue(e.target.value)}
              className="input flex-1"
              placeholder="Value"
              disabled={loading || room.status !== 'waiting'}
            />
            <button
              type="button"
              onClick={handleAddHeader}
              className="btn btn-secondary"
              disabled={loading || room.status !== 'waiting' || !headerKey.trim()}
            >
              Add
            </button>
          </div>
          
          {Object.entries(config.headers).length > 0 && (
            <div className="mt-2 border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Key</th>
                    <th className="px-4 py-2 text-left">Value</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(config.headers).map(([key, value]) => (
                    <tr key={key} className="border-t">
                      <td className="px-4 py-2">{key}</td>
                      <td className="px-4 py-2">{value}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveHeader(key)}
                          className="text-red-500 hover:text-red-700"
                          disabled={loading || room.status !== 'waiting'}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading || room.status !== 'waiting'}
        >
          {loading ? 'Configuring...' : 'Configure Test'}
        </button>
      </form>
    </div>
  );
};

export default TestConfigForm;

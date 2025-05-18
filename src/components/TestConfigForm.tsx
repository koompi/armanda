import React, { useState } from "react";
import useStore, { TestConfig } from "../store/useStore";

const TestConfigForm: React.FC = () => {
  const { room, testConfig, configureTest } = useStore();
  const [config, setConfig] = useState<TestConfig>(
    testConfig || {
      url: "",
      method: "GET",
      headers: {},
      body: undefined,
      requests_per_client: 100,
      concurrency: 10,
      timeout_ms: 5000,
    }
  );
  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (
      name === "requests_per_client" ||
      name === "concurrency" ||
      name === "timeout_ms"
    ) {
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

    setHeaderKey("");
    setHeaderValue("");
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
      setError("URL is required");
      return;
    }

    setLoading(true);
    setError(null);
    const success = await configureTest(config);
    setLoading(false);

    if (!success) {
      setError("Failed to configure test");
    }
  };

  if (!room.roomId || !room.isHost || room.status === "running") {
    return null;
  }

  const isConfigurable = room.status === "waiting";

  return (
    <div className={room.status === "configured" ? "card-highlight" : "card"}>
      <div className="flex items-center mb-4">
        <div className="mr-3 bg-tomada p-2 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Configure Test</h2>
        {room.status === "configured" && (
          <span className="ml-auto badge badge-warning">Configured</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Target URL
            </label>
            <div className="relative">
              <input
                id="url"
                name="url"
                type="url"
                value={config.url}
                onChange={handleChange}
                className="input w-full pl-10"
                placeholder="https://example.com"
                disabled={loading || !isConfigurable}
                required
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="method" className="block text-sm font-medium mb-2">
              HTTP Method
            </label>
            <div className="relative">
              <select
                id="method"
                name="method"
                value={config.method}
                onChange={handleChange}
                className="input w-full pl-10 appearance-none"
                disabled={loading || !isConfigurable}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="timeout_ms"
              className="block text-sm font-medium mb-2"
            >
              Timeout (ms)
            </label>
            <div className="relative">
              <input
                id="timeout_ms"
                name="timeout_ms"
                type="number"
                value={config.timeout_ms}
                onChange={handleChange}
                className="input w-full pl-10"
                min="100"
                max="60000"
                disabled={loading || !isConfigurable}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="requests_per_client"
              className="block text-sm font-medium mb-2"
            >
              Requests Per Client
            </label>
            <div className="relative">
              <input
                id="requests_per_client"
                name="requests_per_client"
                type="number"
                value={config.requests_per_client}
                onChange={handleChange}
                className="input w-full pl-10"
                min="1"
                max="10000"
                disabled={loading || !isConfigurable}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="concurrency"
              className="block text-sm font-medium mb-2"
            >
              Concurrency
            </label>
            <div className="relative">
              <input
                id="concurrency"
                name="concurrency"
                type="number"
                value={config.concurrency}
                onChange={handleChange}
                className="input w-full pl-10"
                min="1"
                max="100"
                disabled={loading || !isConfigurable}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {(config.method === "POST" ||
          config.method === "PUT" ||
          config.method === "PATCH") && (
          <div>
            <label htmlFor="body" className="block text-sm font-medium mb-2">
              Request Body
            </label>
            <textarea
              id="body"
              name="body"
              value={config.body || ""}
              onChange={handleChange}
              className="input w-full h-24 font-mono text-sm"
              placeholder="Request body (JSON, etc.)"
              disabled={loading || !isConfigurable}
            />
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Headers</label>
            <span className="text-xs text-gray-500">
              {Object.keys(config.headers).length} headers
            </span>
          </div>

          {isConfigurable && (
            <div className="flex space-x-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                  className="input w-full"
                  placeholder="Header name"
                  disabled={loading}
                />
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                  className="input w-full"
                  placeholder="Header value"
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={handleAddHeader}
                className="btn btn-secondary px-3"
                disabled={loading || !headerKey.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          {Object.entries(config.headers).length > 0 && (
            <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-600">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                      Key
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                      Value
                    </th>
                    {isConfigurable && (
                      <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(config.headers).map(([key, value]) => (
                    <tr
                      key={key}
                      className="border-t border-gray-100 dark:border-gray-600"
                    >
                      <td className="px-4 py-2 font-medium">{key}</td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                        {value}
                      </td>
                      {isConfigurable && (
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveHeader(key)}
                            className="text-red-500 hover:text-red-700"
                            disabled={loading}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm">
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {isConfigurable && (
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Configuring...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Configure Test
              </span>
            )}
          </button>
        )}
      </form>
    </div>
  );
};

export default TestConfigForm;

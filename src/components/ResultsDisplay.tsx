import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useStore, { AggregatedResult } from "../store/useStore";

const COLORS = ["#facc15", "#10b981", "#0ea5e9", "#f43f5e", "#8b5cf6"];

const ResultsDisplay: React.FC = () => {
  const { localResult, aggregatedResult } = useStore();

  const result = aggregatedResult || localResult;

  if (!result) {
    return null;
  }

  // Prepare data for status code pie chart
  const statusCodeData = Object.entries(result.status_codes).map(
    ([code, count]) => ({
      name: code,
      value: count,
    })
  );

  // Prepare data for response time bar chart
  const responseTimeData = [
    { name: "Min", value: result.min_response_time },
    { name: "Avg", value: result.avg_response_time },
    { name: "Max", value: result.max_response_time },
  ];

  // Prepare data for requests bar chart
  const requestsData = [
    { name: "Total", value: result.total_requests },
    { name: "Successful", value: result.successful_requests },
    { name: "Failed", value: result.failed_requests },
  ];

  // Calculate success rate
  const successRate =
    result.total_requests > 0
      ? (result.successful_requests / result.total_requests) * 100
      : 0;

  return (
    <div className="card-highlight">
      <div className="flex items-center mb-6">
        <div className="mr-3 bg-tomada p-2 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Test Results</h2>
        <span className="ml-auto badge badge-success">Completed</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-700 p-5 rounded-xl shadow-soft border border-gray-100 dark:border-gray-600">
          <div className="flex items-center mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-tomada"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <h3 className="text-lg font-bold">Request Summary</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.total_requests.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Successful
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.successful_requests.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Failed
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {result.failed_requests.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Success Rate
              </p>
              <p
                className="text-2xl font-bold"
                style={{
                  color:
                    successRate > 90
                      ? "#059669"
                      : successRate > 70
                      ? "#d97706"
                      : "#dc2626",
                }}
              >
                {successRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-soft border border-gray-100 dark:border-gray-600">
          <div className="flex items-center mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-tomada"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-bold">Performance</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Min Response Time
              </span>
              <span className="font-medium">
                {result.min_response_time.toFixed(2)} ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Avg Response Time
              </span>
              <span className="font-medium">
                {result.avg_response_time.toFixed(2)} ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Max Response Time
              </span>
              <span className="font-medium">
                {result.max_response_time.toFixed(2)} ms
              </span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Throughput
                </span>
                <span className="font-bold text-tomada-dark">
                  {result.throughput.toFixed(2)} req/s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {"clientCount" in result && (
        <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-soft border border-gray-100 dark:border-gray-600 mb-8">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-tomada"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <h3 className="text-lg font-bold">Distributed Test</h3>
            <div className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-3 py-1 rounded-full text-sm font-medium">
              {(result as AggregatedResult).clientCount} Clients
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-soft border border-gray-100 dark:border-gray-600">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-tomada"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Response Times
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                <YAxis unit=" ms" tick={{ fill: "#6b7280" }} />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)} ms`,
                    "Response Time",
                  ]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderColor: "#e5e7eb",
                  }}
                  labelStyle={{ color: "#111827" }}
                />
                <Legend />
                <Bar dataKey="value" fill="#facc15" name="Response Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-soft border border-gray-100 dark:border-gray-600">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-tomada"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Requests
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderColor: "#e5e7eb",
                  }}
                  labelStyle={{ color: "#111827" }}
                />
                <Legend />
                <Bar dataKey="value" fill="#facc15" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-soft border border-gray-100 dark:border-gray-600">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-tomada"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Status Codes
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCodeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#facc15"
                  dataKey="value"
                >
                  {statusCodeData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [value, "Requests"]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderColor: "#e5e7eb",
                  }}
                  labelStyle={{ color: "#111827" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Test completed at {new Date(result.timestamp * 1000).toLocaleString()}
        </p>
        <p>Test duration: {(result.duration / 1000).toFixed(2)} seconds</p>
      </div>
    </div>
  );
};

export default ResultsDisplay;

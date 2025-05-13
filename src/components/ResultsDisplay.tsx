import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useStore, { AggregatedResult } from '../store/useStore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ResultsDisplay: React.FC = () => {
  const { localResult, aggregatedResult } = useStore();

  const result = aggregatedResult || localResult;

  if (!result) {
    return null;
  }

  // Prepare data for status code pie chart
  const statusCodeData = Object.entries(result.status_codes).map(([code, count]) => ({
    name: code,
    value: count,
  }));

  // Prepare data for response time bar chart
  const responseTimeData = [
    { name: 'Min', value: result.min_response_time },
    { name: 'Avg', value: result.avg_response_time },
    { name: 'Max', value: result.max_response_time },
  ];

  // Prepare data for requests bar chart
  const requestsData = [
    { name: 'Total', value: result.total_requests },
    { name: 'Successful', value: result.successful_requests },
    { name: 'Failed', value: result.failed_requests },
  ];

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Test Results</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Summary</h3>
          <div className="space-y-1">
            <p>
              <span className="font-medium">Total Requests:</span> {result.total_requests}
            </p>
            <p>
              <span className="font-medium">Successful:</span> {result.successful_requests}
            </p>
            <p>
              <span className="font-medium">Failed:</span> {result.failed_requests}
            </p>
            <p>
              <span className="font-medium">Success Rate:</span>{' '}
              {result.total_requests > 0
                ? ((result.successful_requests / result.total_requests) * 100).toFixed(2)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Performance</h3>
          <div className="space-y-1">
            <p>
              <span className="font-medium">Min Response Time:</span> {result.min_response_time.toFixed(2)} ms
            </p>
            <p>
              <span className="font-medium">Avg Response Time:</span> {result.avg_response_time.toFixed(2)} ms
            </p>
            <p>
              <span className="font-medium">Max Response Time:</span> {result.max_response_time.toFixed(2)} ms
            </p>
            <p>
              <span className="font-medium">Throughput:</span> {result.throughput.toFixed(2)} req/s
            </p>
          </div>
        </div>
      </div>

      {'clientCount' in result && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Distributed Test</h3>
          <p>
            <span className="font-medium">Participating Clients:</span> {(result as AggregatedResult).clientCount}
          </p>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-2">Response Times</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit=" ms" />
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)} ms`, 'Response Time']} />
                <Legend />
                <Bar dataKey="value" fill="#0ea5e9" name="Response Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Requests</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Status Codes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCodeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusCodeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Requests']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;

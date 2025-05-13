import ConnectionForm from "./components/ConnectionForm";
import RoomManager from "./components/RoomManager";
import TestConfigForm from "./components/TestConfigForm";
import TestController from "./components/TestController";
import ResultsDisplay from "./components/ResultsDisplay";
import useStore from "./store/useStore";

function App() {
  const { localResult, aggregatedResult } = useStore();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-center">Armandra</h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Distributed Stress Testing Tool
        </p>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-6">
            <ConnectionForm />
            <RoomManager />
          </div>
          <div className="space-y-6">
            <TestConfigForm />
            <TestController />
          </div>
        </div>

        {(localResult || aggregatedResult) && (
          <div className="mb-8">
            <ResultsDisplay />
          </div>
        )}

        <footer className="text-center text-gray-500 text-sm mt-12">
          <p>Armandra v0.1.0 - Distributed Stress Testing Tool</p>
        </footer>
      </main>
    </div>
  );
}

export default App;

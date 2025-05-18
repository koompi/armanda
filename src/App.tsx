import ConnectionForm from "./components/ConnectionForm";
import RoomManager from "./components/RoomManager";
import TestConfigForm from "./components/TestConfigForm";
import TestController from "./components/TestController";
import ResultsDisplay from "./components/ResultsDisplay";
import useStore from "./store/useStore";

function App() {
  const { localResult, aggregatedResult } = useStore();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 p-4 transition-colors duration-200">
      <header className="max-w-6xl mx-auto mb-8 pt-6">
        <div className="flex items-center justify-center mb-2">
          <img
            src="/src-tauri/icons/tomada/icon_128x128.png"
            alt="Tomada Logo"
            className="h-16 w-16 mr-3"
          />
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-tomada-dark via-tomada to-yellow-300 text-transparent bg-clip-text">
            Tomada
          </h1>
        </div>
        <p className="text-center text-gray-700 dark:text-tomada-light font-medium">
          Distributed Stress Testing Tool
        </p>
        <div className="w-24 h-1 bg-tomada mx-auto mt-2 rounded-full"></div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-8">
            <ConnectionForm />
            <RoomManager />
          </div>
          <div className="space-y-8">
            <TestConfigForm />
            <TestController />
          </div>
        </div>

        {(localResult || aggregatedResult) && (
          <div className="mb-8">
            <ResultsDisplay />
          </div>
        )}

        <footer className="text-center text-gray-600 dark:text-gray-400 text-sm mt-16 mb-4 flex flex-col items-center">
          <div className="w-16 h-0.5 bg-tomada mb-4 rounded-full"></div>
          <p>Tomada v0.1.0 - Distributed Stress Testing Tool</p>
          <p className="mt-1">© {new Date().getFullYear()} KOOMPI</p>
        </footer>
      </main>
    </div>
  );
}

export default App;

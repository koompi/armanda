import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface TestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  requests_per_client: number;
  concurrency: number;
  timeout_ms: number;
}

export interface TestResult {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  min_response_time: number;
  max_response_time: number;
  avg_response_time: number;
  total_response_time: number;
  status_codes: Record<string, number>;
  duration: number;
  throughput: number;
  test_id: string;
  timestamp: number;
}

export interface AggregatedResult extends TestResult {
  clientCount: number;
}

interface RoomState {
  roomId: string | null;
  clientCount: number;
  status: "waiting" | "configured" | "running" | "completed";
  isHost: boolean;
}

interface StoreState {
  // Connection state
  serverUrl: string;
  isConnected: boolean;
  connectionError: string | null;

  // Room state
  room: RoomState;

  // Test configuration
  testConfig: TestConfig | null;

  // Test results
  localResult: TestResult | null;
  aggregatedResult: AggregatedResult | null;

  // Actions
  setServerUrl: (url: string) => void;
  connectToServer: () => Promise<boolean>;
  createRoom: () => Promise<boolean>;
  joinRoom: (roomId: string) => Promise<boolean>;
  configureTest: (config: TestConfig) => Promise<boolean>;
  startTest: () => Promise<boolean>;
  runTest: (config: TestConfig) => Promise<TestResult | null>;
  submitResults: (results: TestResult) => Promise<boolean>;
  leaveRoom: () => Promise<boolean>;
  reset: () => void;
}

const defaultTestConfig: TestConfig = {
  url: "",
  method: "GET",
  headers: {},
  body: undefined,
  requests_per_client: 100,
  concurrency: 10,
  timeout_ms: 5000,
};

const useStore = create<StoreState>((set, get) => ({
  // Connection state
  serverUrl: "wss://armandra.koompi.cloud",
  isConnected: false,
  connectionError: null,

  // Room state
  room: {
    roomId: null,
    clientCount: 0,
    status: "waiting",
    isHost: false,
  },

  // Test configuration
  testConfig: { ...defaultTestConfig },

  // Test results
  localResult: null,
  aggregatedResult: null,

  // Actions
  setServerUrl: (url: string) => set({ serverUrl: url }),

  connectToServer: async () => {
    try {
      const response: any = await invoke("connect_to_server", {
        serverUrl: get().serverUrl,
      });

      if (response.success) {
        set({ isConnected: true, connectionError: null });
        return true;
      } else {
        set({ isConnected: false, connectionError: response.error });
        return false;
      }
    } catch (error) {
      set({ isConnected: false, connectionError: String(error) });
      return false;
    }
  },

  createRoom: async () => {
    try {
      // First check if we're connected
      if (!get().isConnected) {
        console.error("Not connected to server");
        return false;
      }

      const response: any = await invoke("create_room", {});

      if (response.success) {
        set({
          room: {
            roomId: response.room_id,
            clientCount: response.client_count || 1,
            status: "waiting",
            isHost: true,
          },
        });
        return true;
      } else {
        console.error("Error creating room:", response.error);
        return false;
      }
    } catch (error) {
      console.error("Error creating room:", error);
      return false;
    }
  },

  joinRoom: async (roomId: string) => {
    try {
      // First check if we're connected
      if (!get().isConnected) {
        console.error("Not connected to server");
        return false;
      }

      const response: any = await invoke("join_room", { roomId });

      if (response.success) {
        set({
          room: {
            roomId: response.room_id,
            clientCount: response.client_count || 1,
            status: (response.status as any) || "waiting",
            isHost: false,
          },
          testConfig: response.config || { ...defaultTestConfig },
        });
        return true;
      } else {
        console.error("Error joining room:", response.error);
        return false;
      }
    } catch (error) {
      console.error("Error joining room:", error);
      return false;
    }
  },

  configureTest: async (config: TestConfig) => {
    try {
      const response: any = await invoke("configure_test", { config });

      if (response.success) {
        set({
          testConfig: config,
          room: {
            ...get().room,
            status: "configured",
          },
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error configuring test:", error);
      return false;
    }
  },

  startTest: async () => {
    try {
      const response: any = await invoke("start_test", {});

      if (response.success) {
        set({
          room: {
            ...get().room,
            status: "running",
          },
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error starting test:", error);
      return false;
    }
  },

  runTest: async (config: TestConfig) => {
    try {
      const response: any = await invoke("run_test", { config });

      if (response.success && response.result) {
        set({ localResult: response.result });
        return response.result;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error running test:", error);
      return null;
    }
  },

  submitResults: async (results: TestResult) => {
    try {
      const response: any = await invoke("submit_results", { results });
      return response.success;
    } catch (error) {
      console.error("Error submitting results:", error);
      return false;
    }
  },

  leaveRoom: async () => {
    try {
      const response: any = await invoke("leave_room", {});

      if (response.success) {
        set({
          room: {
            roomId: null,
            clientCount: 0,
            status: "waiting",
            isHost: false,
          },
          testConfig: { ...defaultTestConfig },
          localResult: null,
          aggregatedResult: null,
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error leaving room:", error);
      return false;
    }
  },

  reset: () => {
    set({
      room: {
        roomId: null,
        clientCount: 0,
        status: "waiting",
        isHost: false,
      },
      testConfig: { ...defaultTestConfig },
      localResult: null,
      aggregatedResult: null,
    });
  },
}));

export default useStore;

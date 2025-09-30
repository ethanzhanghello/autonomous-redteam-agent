import { create } from "zustand";

export type EventMsg = {
  run_id: string;
  timestamp: string;
  agent: string;
  level: string;
  event_type: string;
  message: string;
  payload?: any;
};

export type CampaignConfig = {
  targets: string[];
  simulation_only: boolean;
  depth?: string;
  time_budget?: number;
};

type RunState = {
  currentRunId?: string;
  events: EventMsg[];
  isRunning: boolean;
  startRun: (cfg: CampaignConfig) => Promise<void>;
  connectEvents: (runId: string) => void;
  stopRun: () => void;
  clear: () => void;
  addEvent: (event: EventMsg) => void;
};

export const useRunStore = create<RunState>((set, get) => ({
  events: [],
  isRunning: false,
  
  async startRun(cfg: CampaignConfig) {
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg)
      });
      
      if (!res.ok) {
        throw new Error(`Failed to start campaign: ${res.statusText}`);
      }
      
      const { run_id } = await res.json();
      set({ currentRunId: run_id, events: [], isRunning: true });
      get().connectEvents(run_id);
    } catch (error) {
      console.error("Failed to start campaign:", error);
      throw error;
    }
  },
  
  connectEvents(runId: string) {
    const es = new EventSource(`/api/campaigns/${runId}/events`);
    
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        set(state => ({ 
          events: [...state.events, event].slice(-1000) // Keep last 1000 events
        }));
      } catch (error) {
        console.error("Failed to parse event:", error);
      }
    };
    
    es.onerror = () => {
      console.error("EventSource failed");
      es.close();
      set({ isRunning: false });
    };
    
    // Store EventSource reference for cleanup
    (es as any)._cleanup = () => es.close();
  },
  
  stopRun() {
    const { currentRunId } = get();
    if (currentRunId) {
      fetch(`/api/campaigns/${currentRunId}/stop`, { method: "POST" })
        .catch(console.error);
    }
    set({ isRunning: false });
  },
  
  addEvent(event: EventMsg) {
    set(state => ({ events: [...state.events, event] }));
  },
  
  clear() {
    set({ events: [], currentRunId: undefined, isRunning: false });
  }
}));

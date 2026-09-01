import type {
  LiveTelemetrySnapshot,
  LiveTelemetryState,
} from "@/lib/live/types";

interface LiveStore {
  sequence: number;
  snapshot: LiveTelemetrySnapshot | null;
  subscribers: Set<(state: LiveTelemetryState) => void>;
}

const globalStore = globalThis as typeof globalThis & {
  __signalafLiveStore?: LiveStore;
};

export const liveStore: LiveStore =
  globalStore.__signalafLiveStore ??
  (globalStore.__signalafLiveStore = {
    sequence: 0,
    snapshot: null,
    subscribers: new Set(),
  });

export function liveState(): LiveTelemetryState {
  return {
    status: liveStore.snapshot ? "live" : "waiting",
    sequence: liveStore.sequence,
    snapshot: liveStore.snapshot,
  };
}

export function publishLiveState(state: LiveTelemetryState): void {
  for (const subscriber of liveStore.subscribers) {
    try {
      subscriber(state);
    } catch {
      liveStore.subscribers.delete(subscriber);
    }
  }
}

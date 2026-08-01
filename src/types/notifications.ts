/** A discoverable notification integration (mirrors backend NotifierChannel). */
export interface NotifyChannel {
  id: string;
  name: string;
  enabled: boolean;
}

/** Response from POST /api/notify/test — number of channels that received it. */
export interface NotifyTestResult {
  sent: number;
}

/** Response from POST /api/notify/summary — channels that got the digest. */
export interface NotifySummaryResult {
  sent: number;
  errors?: string[];
}

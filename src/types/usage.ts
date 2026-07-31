/** Point-in-time view of Nexus local footprint + process memory (mirrors usage.Snapshot). */
export interface UsageSnapshot {
  dataDir: string;
  totalBytes: number;
  dbBytes: number;
  resumesBytes: number;
  metaBytes: number;
  otherBytes: number;
  jobCount: number;
  heapAlloc: number;
  sysBytes: number;
  goroutines: number;
  aiMode: string; // off | api | local
  collectedAt: string; // ISO 8601
  err: string;
}

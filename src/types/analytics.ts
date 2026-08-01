/** Outcome funnel from the analytics API (mirrors store.Funnel). */
export interface AnalyticsFunnel {
  applied: number;
  replied: number;
  interview: number;
  offer: number;
  rejected: number;
  ghosted: number;
}

/** One provider's funnel + reply probability (mirrors store.ProviderYield). */
export interface AnalyticsProviderYield {
  provider: string;
  applied: number;
  replied: number;
  interview: number;
  offer: number;
  replyProbability: number;
}

/** Applications applied on one calendar day. */
export interface DayCount {
  date: string; // YYYY-MM-DD
  count: number;
}

/** The full /api/analytics snapshot. */
export interface AnalyticsSnapshot {
  statusTotals: Record<string, number>;
  funnel: AnalyticsFunnel;
  perProvider: AnalyticsProviderYield[];
  appliedLast7Days: DayCount[];
  appliedLast30Days: DayCount[];
  responseProbability: number;
  generatedAt: string;
}

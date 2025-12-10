export type RejectionReason = 'no_credit' | 'no_money' | 'not_interested' | 'other';

export interface CallReport {
  id: string;
  agent_name?: string;
  donation_closed: boolean;
  rejection_reason: RejectionReason | null;
  timestamp: string;
}

export interface AppSettings {
  makeWebhookUrl: string;
  agentName: string;
  dailyReportTime: string; // Format "HH:MM"
}

export interface ChartData {
  name: string;
  value: number;
  fill: string;
  [key: string]: any;
}

export interface DailyStats {
  total: number;
  closedRate: string;
  chartData: ChartData[];
  mainDifficulty: string;
  failedTotal: number;
  closedTotal: number;
  rejectionCounts: Record<RejectionReason, number>;
}

export const REJECTION_LABELS: Record<RejectionReason, string> = {
  no_credit: 'אין אשראי',
  no_money: 'אין לי כסף',
  not_interested: 'לא מעוניין',
  other: 'אחר'
};
import { CallReport, DailyStats, REJECTION_LABELS, RejectionReason } from '../types';

const REJECTION_KEYS: RejectionReason[] = ['no_credit', 'no_money', 'not_interested', 'other'];

export const calculateDailyStats = (reports: CallReport[]): DailyStats | null => {
  if (reports.length === 0) return null;

  const total = reports.length;
  const closed = reports.filter(r => r.donation_closed).length;
  const closedRate = total > 0 ? ((closed / total) * 100).toFixed(0) : '0';

  const failedReports = reports.filter(r => !r.donation_closed && r.rejection_reason);
  
  const counts: Record<RejectionReason, number> = {
    no_credit: 0,
    no_money: 0,
    not_interested: 0,
    other: 0
  };

  failedReports.forEach(r => {
    if (r.rejection_reason && counts[r.rejection_reason] !== undefined) {
      counts[r.rejection_reason]++;
    }
  });

  const chartData = REJECTION_KEYS.map(key => ({
    name: REJECTION_LABELS[key],
    value: counts[key],
    fill: '' // Will be assigned in component
  })).filter(item => item.value > 0);

  let mainDifficulty = 'אין נתונים';
  let maxCount = 0;

  Object.entries(counts).forEach(([key, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mainDifficulty = REJECTION_LABELS[key as RejectionReason];
    }
  });

  return {
    total,
    closedRate,
    chartData,
    mainDifficulty,
    failedTotal: failedReports.length,
    closedTotal: closed,
    rejectionCounts: counts
  };
};
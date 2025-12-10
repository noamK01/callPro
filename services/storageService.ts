import { CallReport, AppSettings } from '../types';

const REPORTS_KEY = 'call_agent_reports';
const SETTINGS_KEY = 'call_agent_settings';
const LAST_REPORT_DATE_KEY = 'call_agent_last_daily_report';

export const storageService = {
  getReports: (): CallReport[] => {
    try {
      const data = localStorage.getItem(REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse reports', e);
      return [];
    }
  },

  saveReport: (report: CallReport): CallReport[] => {
    const current = storageService.getReports();
    const updated = [...current, report];
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
    return updated;
  },

  clearReports: (): void => {
    localStorage.removeItem(REPORTS_KEY);
  },

  getSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      const parsed = data ? JSON.parse(data) : {};
      return {
        makeWebhookUrl: parsed.makeWebhookUrl || '',
        agentName: parsed.agentName || '',
        dailyReportTime: parsed.dailyReportTime || '17:00'
      };
    } catch (e) {
      return { makeWebhookUrl: '', agentName: '', dailyReportTime: '17:00' };
    }
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  getLastDailyReportDate: (): string | null => {
    return localStorage.getItem(LAST_REPORT_DATE_KEY);
  },

  setLastDailyReportDate: (dateStr: string): void => {
    localStorage.setItem(LAST_REPORT_DATE_KEY, dateStr);
  },

  clearAll: (): void => {
    localStorage.removeItem(REPORTS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(LAST_REPORT_DATE_KEY);
  }
};
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, PieChart as PieChartIcon, Activity, Send, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { storageService } from '../services/storageService';
import { sendToIntegrations } from '../services/integrationService';
import { CallReport } from '../types';
import { calculateDailyStats } from '../services/statsService';

interface DashboardProps {
  reports: CallReport[];
  onReset: () => void;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

export const Dashboard: React.FC<DashboardProps> = ({ reports, onReset }) => {
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSentMsg, setReportSentMsg] = useState('');

  const stats = useMemo(() => {
    const data = calculateDailyStats(reports);
    if (data) {
        data.chartData = data.chartData.map((item, index) => ({
            ...item,
            fill: COLORS[index % COLORS.length]
        }));
    }
    return data;
  }, [reports]);

  const handleSendDailyReport = async () => {
    if (!stats) return;
    
    setSendingReport(true);
    const settings = storageService.getSettings();

    if (!settings.zapierWebhookUrl && !settings.makeWebhookUrl) {
      alert('נא להגדיר כתובת Zapier או Make בהגדרות');
      setSendingReport(false);
      return;
    }

    const dailySummary = {
        type: 'daily_summary',
        agent_name: settings.agentName || 'לא הוגדר',
        date: new Date().toLocaleDateString('he-IL'),
        total_calls: stats.total,
        total_sales: stats.closedTotal,
        failed_total: stats.failedTotal,
        conversion_rate: `${stats.closedRate}%`,
        top_rejection_reason: stats.mainDifficulty, // This is the "Most frequent reason"
        count_no_credit: stats.rejectionCounts.no_credit,
        count_no_money: stats.rejectionCounts.no_money,
        count_not_interested: stats.rejectionCounts.not_interested,
        count_other: stats.rejectionCounts.other
    };

    try {
        await sendToIntegrations({
            zapierUrl: settings.zapierWebhookUrl,
            makeUrl: settings.makeWebhookUrl
        }, dailySummary);
        
        setReportSentMsg('הדוח נשלח בהצלחה!');
        storageService.setLastDailyReportDate(new Date().toDateString());
        setTimeout(() => setReportSentMsg(''), 4000);
    } catch (e) {
        alert('שגיאה בשליחת הדוח');
    } finally {
        setSendingReport(false);
    }
  };

  const handleResetData = () => {
      if (window.confirm('האם אתה בטוח שברצונך לאפס את כל הנתונים של היום? פעולה זו אינה הפיכה ומחייבת דיווח מחדש.')) {
          storageService.clearReports();
          onReset();
          window.location.reload(); 
      }
  };

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm animate-fade-in">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Activity className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-600 mb-2">אין נתונים להצגה</h3>
        <p className="text-sm">התחל לדווח על שיחות והנתונים יופיעו כאן באופן אוטומטי</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl p-6 shadow-xl shadow-indigo-200">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="w-24 h-24 transform translate-x-4 -translate-y-4" />
          </div>
          <p className="text-indigo-100 text-sm font-medium mb-1">אחוז סגירה</p>
          <div className="flex items-baseline">
            <h2 className="text-4xl font-bold">{stats.closedRate}%</h2>
            <span className="text-sm text-indigo-200 mr-2">הצלחה</span>
          </div>
          <div className="mt-4 w-full bg-white/20 rounded-full h-1.5">
            <div 
              className="bg-white h-1.5 rounded-full transition-all duration-1000" 
              style={{ width: `${stats.closedRate}%` }}
            ></div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-orange-600 text-white rounded-2xl p-6 shadow-xl shadow-rose-200">
           <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-24 h-24 transform translate-x-4 -translate-y-4" />
          </div>
          <p className="text-rose-100 text-sm font-medium mb-1">הסירוב הנפוץ</p>
          <h2 className="text-3xl font-bold truncate mt-1">{stats.mainDifficulty}</h2>
          <p className="text-xs text-rose-100 mt-2 opacity-80">דורש תשומת לב לשיפור</p>
        </div>

        <div className="relative overflow-hidden bg-white border border-slate-100 text-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-100">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp className="w-24 h-24 transform translate-x-4 -translate-y-4" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">סה"כ שיחות היום</p>
          <h2 className="text-4xl font-bold text-slate-800">{stats.total}</h2>
          <div className="flex space-x-3 space-x-reverse mt-4 text-sm">
             <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">{stats.closedTotal} סגירות</span>
             <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-medium">{stats.failedTotal} סירובים</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="התפלגות סיבות סירוב" icon={<PieChartIcon className="w-5 h-5"/>} className="lg:col-span-2 min-h-[450px]">
          {stats.chartData.length > 0 ? (
            <div className="h-80 w-full relative" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-600 font-medium ml-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-3xl font-bold text-slate-800">{stats.failedTotal}</span>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">סירובים</span>
              </div>
            </div>
          ) : (
             <div className="h-80 flex flex-col items-center justify-center text-slate-400">
               <CheckCircle className="w-16 h-16 mb-4 text-emerald-100" />
               <p className="text-lg font-medium text-emerald-600">אין סירובים להצגה</p>
               <p className="text-sm">ביצועים מושלמים!</p>
             </div>
          )}
        </Card>

        <div className="space-y-6">
           <Card title="דוח סוף יום" className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none shadow-2xl">
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  הדוח היומי מוגדר להישלח אוטומטית בשעה שנבחרה בהגדרות. ניתן גם לשלוח ידנית כעת.
              </p>
              
              <button
                onClick={handleSendDailyReport}
                disabled={sendingReport}
                className="w-full flex items-center justify-center px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-primary-900/50"
              >
                {sendingReport ? (
                    <span className="flex items-center"><Activity className="animate-spin w-4 h-4 ml-2"/> שולח...</span>
                ) : (
                    <span className="flex items-center font-bold"><Send className="w-4 h-4 ml-2"/> שלח עכשיו ידנית</span>
                )}
              </button>
              {reportSentMsg && (
                  <p className="text-emerald-400 text-xs text-center mt-3 animate-fade-in font-bold">{reportSentMsg}</p>
              )}
           </Card>

           <Card title="אזור ניהול">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                    סיום יום עבודה? נקה את הנתונים המקומיים כדי להתחיל מחר דף חדש ונקי.
                  </p>
                  
                  <button
                    onClick={handleResetData}
                    className="w-full flex items-center justify-center px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all duration-200 border border-rose-100"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    <span className="font-bold">מחיקת נתונים ורענון</span>
                  </button>
                </div>
              </div>
            </Card>
        </div>
      </div>
    </div>
  );
};
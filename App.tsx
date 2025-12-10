import React, { useState, useEffect } from 'react';
import { Phone, Settings as SettingsIcon, Menu, X, LayoutDashboard, Clock } from 'lucide-react';
import { ReportForm } from './components/ReportForm';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { storageService } from './services/storageService';
import { sendToIntegrations } from './services/integrationService';
import { calculateDailyStats } from './services/statsService';
import { CallReport } from './types';

type View = 'report' | 'stats' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('report');
  const [reports, setReports] = useState<CallReport[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [autoReportStatus, setAutoReportStatus] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      checkAndSendDailyReport();
    }, 60000); 
    return () => clearInterval(timer);
  }, []);

  const loadData = () => {
    setReports(storageService.getReports());
  };

  const checkAndSendDailyReport = async () => {
    const settings = storageService.getSettings();
    if ((!settings.zapierWebhookUrl && !settings.makeWebhookUrl) || !settings.dailyReportTime) return;

    const now = new Date();
    const currentTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const todayDateStr = now.toDateString();
    const lastReportDate = storageService.getLastDailyReportDate();

    if (currentTime === settings.dailyReportTime && lastReportDate !== todayDateStr) {
       const currentReports = storageService.getReports();
       const stats = calculateDailyStats(currentReports);
       
       if (stats && stats.total > 0) {
         try {
           // Flattened structure for Zapier/Google Sheets
           const dailySummary = {
             type: 'daily_summary',
             agent_name: settings.agentName || 'לא הוגדר',
             date: now.toLocaleDateString('he-IL'),
             total_calls: stats.total,
             total_sales: stats.closedTotal,
             failed_total: stats.failedTotal,
             conversion_rate: `${stats.closedRate}%`,
             top_rejection_reason: stats.mainDifficulty,
             count_no_credit: stats.rejectionCounts.no_credit,
             count_no_money: stats.rejectionCounts.no_money,
             count_not_interested: stats.rejectionCounts.not_interested,
             count_other: stats.rejectionCounts.other,
             auto_generated: true
           };

           await sendToIntegrations({
             zapierUrl: settings.zapierWebhookUrl,
             makeUrl: settings.makeWebhookUrl
           }, dailySummary);

           storageService.setLastDailyReportDate(todayDateStr);
           setAutoReportStatus(`דוח יומי נשלח אוטומטית ב-${currentTime}`);
           setTimeout(() => setAutoReportStatus(null), 5000);
           
         } catch (e) {
           console.error('Auto report failed', e);
         }
       }
    }
  };

  const navItems = [
    { id: 'report', label: 'דיווח שיחה', icon: Phone },
    { id: 'stats', label: 'דשבורד', icon: LayoutDashboard },
    { id: 'settings', label: 'הגדרות', icon: SettingsIcon },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center space-x-3 space-x-reverse px-4 mb-10">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/50">
           <Phone className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">CallAgent</h1>
          <p className="text-xs text-slate-400 font-medium">v5.0 (Make+Zapier)</p>
        </div>
      </div>
      <nav className="space-y-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as View);
                setMobileMenuOpen(false);
              }}
              className={`group w-full flex items-center space-x-3 space-x-reverse px-4 py-3.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {autoReportStatus && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center animate-slide-up">
           <Clock className="w-4 h-4 ml-2" />
           <span className="font-medium text-sm">{autoReportStatus}</span>
        </div>
      )}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 h-screen fixed right-0 top-0 p-6 z-50 shadow-2xl">
        <NavContent />
        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">יעד יומי</span>
                <span className="text-xs text-primary-400">85%</span>
             </div>
             <div className="w-full bg-slate-700 rounded-full h-1.5">
               <div className="bg-primary-500 h-1.5 rounded-full w-[85%]"></div>
             </div>
          </div>
        </div>
      </aside>
      <div className="md:hidden fixed top-0 w-full bg-slate-900 z-40 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center">
             <Phone className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-white text-lg">CallAgent</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
           <div className="bg-slate-900 w-72 h-full p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
              <NavContent />
           </div>
        </div>
      )}
      <main className="flex-1 md:mr-72 p-4 md:p-10 pt-20 md:pt-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                {navItems.find(i => i.id === currentView)?.label}
              </h1>
              <p className="text-slate-500 mt-1 text-lg">
                {currentView === 'report' && 'מלא את פרטי השיחה האחרונה'}
                {currentView === 'stats' && 'סקירה כללית של הביצועים'}
                {currentView === 'settings' && 'הגדרות מערכת (Make & Zapier)'}
              </p>
            </div>
            <div className="hidden md:flex items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-slate-600 text-sm font-medium">
               <span>{new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </header>
          <div className="animate-fade-in">
            {currentView === 'report' && (
              <ReportForm onSave={loadData} />
            )}
            {currentView === 'stats' && (
              <Dashboard reports={reports} onReset={loadData} />
            )}
            {currentView === 'settings' && (
              <Settings />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
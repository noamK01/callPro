import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { storageService } from '../services/storageService';
import { sendToIntegrations } from '../services/integrationService';
import { Save, Webhook, User, Clock, Activity, CheckCircle, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [zapierUrl, setZapierUrl] = useState('');
  const [makeUrl, setMakeUrl] = useState('');
  const [agentName, setAgentName] = useState('');
  const [dailyReportTime, setDailyReportTime] = useState('17:00');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const settings = storageService.getSettings();
    if (settings.zapierWebhookUrl) setZapierUrl(settings.zapierWebhookUrl);
    if (settings.makeWebhookUrl) setMakeUrl(settings.makeWebhookUrl);
    if (settings.agentName) setAgentName(settings.agentName);
    if (settings.dailyReportTime) setDailyReportTime(settings.dailyReportTime);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings({ 
      zapierWebhookUrl: zapierUrl,
      makeWebhookUrl: makeUrl,
      agentName: agentName,
      dailyReportTime: dailyReportTime
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!zapierUrl && !makeUrl) return;
    setTesting(true);
    setTestStatus('idle');
    try {
        await sendToIntegrations({ zapierUrl, makeUrl }, {
            type: 'test_connection',
            message: 'בדיקת תקשורת מוצלחת מהמערכת - CallAgent Pro',
            agent_name: agentName || 'נציג בדיקה', 
            timestamp: new Date().toISOString(),
            total_calls: 0,
            total_sales: 0,
            failed_total: 0,
            conversion_rate: '0%',
            top_rejection_reason: 'בדיקה',
            count_no_credit: 0,
            count_no_money: 0,
            count_not_interested: 0,
            count_other: 0
        });
        setTestStatus('success');
        setTimeout(() => setTestStatus('idle'), 4000);
    } catch (e) {
        setTestStatus('error');
    } finally {
        setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <Card title="הגדרות מערכת">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="border-b border-slate-100 pb-6">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">פרטי נציג</h3>
             <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <User className="w-4 h-4 ml-2 text-primary-500" />
                    שם הנציג
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="לדוגמה: יוסי כהן"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
               </div>
             </div>
          </div>
          <div className="border-b border-slate-100 pb-6">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">אוטומציה</h3>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 ml-2 text-primary-500" />
                  שעת דוח יומי אוטומטי
                </label>
                <input
                  type="time"
                  value={dailyReportTime}
                  onChange={(e) => setDailyReportTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-left dir-ltr"
                />
             </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">אינטגרציות</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                  <Webhook className="w-4 h-4 ml-2 text-orange-500" />
                  כתובת Webhook של Zapier
                </label>
                <input
                  type="url"
                  value={zapierUrl}
                  onChange={(e) => setZapierUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none dir-ltr text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                  <Webhook className="w-4 h-4 ml-2 text-purple-600" />
                  כתובת Webhook של Make.com (Integromat)
                </label>
                <input
                  type="url"
                  value={makeUrl}
                  onChange={(e) => setMakeUrl(e.target.value)}
                  placeholder="https://hook.make.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none dir-ltr text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between mt-3 pt-2">
                  <div className="flex items-center">
                    {testStatus === 'success' && <span className="text-xs text-emerald-600 ml-3 flex items-center font-bold animate-fade-in"><CheckCircle className="w-3 h-3 ml-1"/> תקין!</span>}
                    {testStatus === 'error' && <span className="text-xs text-rose-600 ml-3 flex items-center font-bold animate-fade-in"><AlertCircle className="w-3 h-3 ml-1"/> שגיאה</span>}
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={(!zapierUrl && !makeUrl) || testing}
                        className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                    >
                        {testing ? <Activity className="w-3 h-3 animate-spin"/> : 'בדוק חיבור'}
                    </button>
                  </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className={`flex items-center px-8 py-3 rounded-xl text-white font-medium transition-all transform hover:scale-105 shadow-lg ${saved ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-200'}`}
            >
              <Save className="w-4 h-4 ml-2" />
              {saved ? 'ההגדרות נשמרו!' : 'שמור הגדרות'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { storageService } from '../services/storageService';
import { sendToIntegrations } from '../services/integrationService';
import { Save, Webhook, User, Clock, Activity, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [makeUrl, setMakeUrl] = useState('');
  const [agentName, setAgentName] = useState('');
  const [dailyReportTime, setDailyReportTime] = useState('17:00');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const settings = storageService.getSettings();
    if (settings.makeWebhookUrl) setMakeUrl(settings.makeWebhookUrl);
    if (settings.agentName) setAgentName(settings.agentName);
    if (settings.dailyReportTime) setDailyReportTime(settings.dailyReportTime);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings({ 
      makeWebhookUrl: makeUrl,
      agentName: agentName,
      dailyReportTime: dailyReportTime
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!makeUrl) return;
    setTesting(true);
    setTestStatus('idle');
    try {
        await sendToIntegrations({ makeUrl }, {
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

  const handleFactoryReset = () => {
    if (window.confirm('אזהרה חמורה! פעולה זו תמחק את כל הנתונים, ההגדרות והקישורים ל-Make. האפליקציה תחזור למצב התחלתי. האם להמשיך?')) {
      storageService.clearAll();
      window.location.reload();
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
                  <Webhook className="w-4 h-4 ml-2 text-purple-600" />
                  כתובת Webhook של Make.com
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
                        disabled={!makeUrl || testing}
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

        <div className="mt-12 border-t border-rose-100 pt-8">
            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-4">אזור סכנה</h3>
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-rose-700">איפוס מלא (הגדרות יצרן)</h4>
                    <p className="text-xs text-rose-600 mt-1">מוחק את כל הנתונים, ההגדרות והחיבורים.</p>
                </div>
                <button 
                    onClick={handleFactoryReset}
                    className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg font-bold text-sm transition-colors flex items-center"
                >
                    <Trash2 className="w-4 h-4 ml-2"/>
                    אפס הכל
                </button>
            </div>
        </div>
      </Card>
    </div>
  );
};
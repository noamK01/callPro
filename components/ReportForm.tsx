import React, { useState } from 'react';
import { Save, AlertCircle, Check, X, PhoneCall, HelpCircle, ArrowRight } from 'lucide-react';
import { Card } from './ui/Card';
import { storageService } from '../services/storageService';
import { sendToIntegrations } from '../services/integrationService';
import { CallReport, RejectionReason, REJECTION_LABELS } from '../types';

interface ReportFormProps {
  onSave: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({ onSave }) => {
  const [loading, setLoading] = useState(false);
  const [donationClosed, setDonationClosed] = useState<boolean | null>(null);
  const [selectedReason, setSelectedReason] = useState<RejectionReason | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isFormValid = () => {
    if (donationClosed === null) return false;
    if (donationClosed === false && !selectedReason) return false;
    return true;
  };

  const getButtonText = () => {
    if (loading) return 'מעבד נתונים...';
    if (donationClosed === null) return 'נא לבחור סטטוס שיחה';
    if (donationClosed === false && !selectedReason) return 'נא לבחור סיבת סירוב';
    return 'שמור דיווח';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;

    setLoading(true);
    setMessage(null);

    const settings = storageService.getSettings();

    const newReport: CallReport = {
      id: crypto.randomUUID(),
      agent_name: settings.agentName || 'לא הוגדר',
      donation_closed: donationClosed!,
      rejection_reason: donationClosed ? null : selectedReason,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    try {
      storageService.saveReport(newReport);
      
      if (settings.makeWebhookUrl) {
        const { id, ...reportData } = newReport;
        await sendToIntegrations(
            { makeUrl: settings.makeWebhookUrl },
            { type: 'single_call', ...reportData }
        );
      }

      setMessage({ type: 'success', text: 'הדיווח נקלט בהצלחה!' });
      
      setTimeout(() => {
        setDonationClosed(null);
        setSelectedReason(null);
        setMessage(null);
        onSave();
      }, 1500);

    } catch (error) {
      setMessage({ type: 'error', text: 'אירעה שגיאה בשמירת הנתונים.' });
    } finally {
      setLoading(false);
    }
  };

  const reasons: RejectionReason[] = ['no_credit', 'no_money', 'not_interested', 'other'];

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <Card title="דיווח שיחה" icon={<PhoneCall className="w-5 h-5" />}>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Donation Status Toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">סטטוס שיחה</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => {
                  setDonationClosed(true);
                  setSelectedReason(null);
                  setMessage(null);
                }}
                className={`group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm ${
                  donationClosed === true
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200 ring-4 ring-emerald-100'
                    : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  donationClosed === true ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'
                }`}>
                  <Check className={`w-7 h-7 ${donationClosed === true ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                </div>
                <span className="font-bold text-xl">התרומה נסגרה!</span>
                <span className={`text-sm mt-1 ${donationClosed === true ? 'text-emerald-100' : 'text-slate-400'}`}>הצלחה</span>
                
                {donationClosed === true && (
                   <div className="absolute inset-0 border-4 border-white/20 rounded-2xl animate-pulse"></div>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDonationClosed(false);
                  setMessage(null);
                }}
                className={`group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm ${
                  donationClosed === false
                    ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-lg shadow-rose-200 ring-4 ring-rose-100'
                    : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-rose-200 hover:bg-rose-50'
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
                   donationClosed === false ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-rose-100'
                }`}>
                  <X className={`w-7 h-7 ${donationClosed === false ? 'text-white' : 'text-slate-400 group-hover:text-rose-500'}`} />
                </div>
                <span className="font-bold text-xl">לא נסגרה</span>
                <span className={`text-sm mt-1 ${donationClosed === false ? 'text-rose-100' : 'text-slate-400'}`}>פספוס</span>
              </button>
            </div>
          </div>

          {/* Rejection Reasons Grid */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${donationClosed === false ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <label className="block text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center">
              <HelpCircle className="w-4 h-4 ml-1" />
              סיבת אי-סגירה
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {reasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`relative py-4 px-2 rounded-xl font-medium text-sm transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                    selectedReason === reason
                      ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 scale-105 ring-2 ring-slate-400'
                      : 'bg-slate-50 text-slate-600 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${selectedReason === reason ? 'bg-rose-400' : 'bg-slate-300'}`}></span>
                  {REJECTION_LABELS[reason]}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              {message.type === 'success' ? <Check className="w-5 h-5 ml-2" /> : <AlertCircle className="w-5 h-5 ml-2" />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform flex items-center justify-center
                ${!isFormValid() || loading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-500 hover:to-indigo-500 hover:scale-[1.01] hover:shadow-primary-200'}
              `}
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ml-3" />}
              {getButtonText()}
              {isFormValid() && !loading && <ArrowRight className="w-5 h-5 mr-2 opacity-80" />}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
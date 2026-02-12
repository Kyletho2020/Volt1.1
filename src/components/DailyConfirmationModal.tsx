import React, { useState, useEffect } from 'react';
import { Truck, ClipboardList, Copy, CheckCircle, Loader2, X } from 'lucide-react';
import type { SavedQuote } from '../services/quoteService';
import { QuoteService } from '../services/quoteService';

interface DailyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DailyConfirmationModal: React.FC<DailyConfirmationModalProps> = ({ isOpen, onClose }) => {
  const [jobNumbersInput, setJobNumbersInput] = useState('');
  const [matchingQuotes, setMatchingQuotes] = useState<SavedQuote[]>([]);
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMatchingQuotes([]);
      setGeneratedText('');
      setJobNumbersInput('');
    }
  }, [isOpen]);

  const parseJobNumbers = (): string[] => {
    return jobNumbersInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const loadQuotes = async () => {
    const jobNumbers = parseJobNumbers();
    if (jobNumbers.length === 0) return;

    setLoading(true);
    try {
      const quotes = await QuoteService.getQuotesByJobNumbers(jobNumbers);
      setMatchingQuotes(quotes);
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateConfirmation = () => {
    const lines = matchingQuotes.map((quote) => {
      const name = quote.contact_name || quote.company_name || quote.project_name || 'Unknown';
      let equipSummary = '';
      if (quote.equipment_requirements) {
        const req = quote.equipment_requirements;
        if (req.crewSize) equipSummary += `${req.crewSize}, `;
        if (req.forklifts && req.forklifts.length > 0) {
          equipSummary += req.forklifts.map((f: any) => `${f.qty || 1} ${f.type || ''}`).join(', ') + ', ';
        }
        if (req.trailers && req.trailers.length > 0) {
          equipSummary += req.trailers.map((t: any) => `${t.qty || 1} ${t.type || ''}`).join(', ') + ', ';
        }
        // Add more as needed
        equipSummary = equipSummary.trim().replace(/, $/, '');
      }
      equipSummary = equipSummary || 'gear truck trailer';
      return `${name} G3 – ${quote.job_number} – ${equipSummary}`;
    });
    setGeneratedText(lines.join(',\n'));
  };

  const copyToClipboard = async () => {
    if (generatedText) {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border border-slate-700/50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20">
                <Truck className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Daily Confirmation</h2>
                <p className="text-slate-400">Load quotes by job numbers and generate reply text</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800/50 rounded-xl transition">
              <X className="h-6 w-6 text-slate-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-3 text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Enter Job Numbers
              </label>
              <textarea
                value={jobNumbersInput}
                onChange={(e) => setJobNumbersInput(e.target.value)}
                placeholder="Paste job numbers&#10;e.g. 9237-24, 1261-26&#10;or one per line"
                rows={3}
                className="w-full p-4 rounded-2xl border border-slate-600/50 bg-slate-900/50 text-white placeholder-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/30 transition resize-vertical"
              />
              <button
                onClick={loadQuotes}
                disabled={loading || parseJobNumbers().length === 0}
                className="mt-3 flex items-center gap-2 bg-accent text-black px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Truck className="h-5 w-5" />}
                Load Quotes ({parseJobNumbers().length})
              </button>
            </div>

            {matchingQuotes.length > 0 && (
              <>
                <div>
                  <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                    Found {matchingQuotes.length} Quote{matchingQuotes.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matchingQuotes.map((quote) => (
                      <div key={quote.id} className="p-6 rounded-2xl border border-slate-700/50 bg-slate-900/50 hover:border-accent/50 transition">
                        <div className="font-mono text-2xl font-bold text-accent mb-2">{quote.job_number}</div>
                        <div className="text-white font-semibold">{quote.contact_name || quote.project_name}</div>
                        <div className="text-slate-400 text-sm">{quote.company_name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateConfirmation}
                  className="w-full bg-gradient-to-r from-accent to-blue-500 text-black px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:from-accent/90 hover:to-blue-400 transition transform hover:scale-[1.02]"
                >
                  Generate Confirmation Text
                </button>
              </>
            )}

            {generatedText && (
              <div>
                <label className="block text-lg font-semibold mb-3 text-white flex items-center gap-2">
                  Reply Text <button onClick={copyToClipboard} className="ml-auto p-2 hover:bg-slate-800 rounded-xl">
                    {copied ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                  </button>
                </label>
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  rows={6}
                  className="w-full p-4 rounded-2xl border border-slate-600/50 bg-slate-900/50 text-white focus:border-accent focus:ring-2 focus:ring-accent/30 transition resize-vertical font-mono text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyConfirmationModal;

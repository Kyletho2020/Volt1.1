import React, { useState, useEffect } from 'react';
import { Truck, ClipboardList, Copy, CheckCircle, Loader2, X, AlertTriangle } from 'lucide-react';
import type { SavedQuote } from '../services/quoteService';
import { QuoteService } from '../services/quoteService';

interface DailyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JOB_NUMBER_REGEX = /\b\d{3,5}-\d{2,4}\b/g;

const buildEquipmentSummary = (quote: SavedQuote): string => {
  const req = quote.equipment_requirements;
  if (!req) return 'gear truck trailer';

  const parts: string[] = ['gear truck trailer'];

  const crewSize = req.crewSize;
  if (crewSize) {
    parts.push(`${crewSize} man crew`);
  }

  const safeArray = (value: unknown) => (Array.isArray(value) ? value : []);

  const allItems = [
    ...safeArray(req.forklifts),
    ...safeArray(req.tractors),
    ...safeArray(req.trailers),
    ...safeArray(req.additionalEquipment),
  ].filter((item: { name?: string; quantity?: number }) => item.quantity && item.quantity > 0);

  if (allItems.length > 0) {
    const itemStrings = allItems.map((item: { name: string; quantity: number }) =>
      item.quantity > 1 ? `${item.quantity} ${item.name}` : item.name
    );
    parts.push(itemStrings.join(', '));
  }

  return parts.join(', ');
};

const buildConfirmationLine = (quote: SavedQuote): string => {
  const contact = quote.contact_name || '';
  const company = quote.company_name || '';
  const nameSection = [contact, company].filter(Boolean).join(' ');
  const jobNumber = quote.job_number || '';
  const startTime = quote.start_time || '';
  const startTimePart = startTime ? `${startTime} start time` : '';
  const equipmentSummary = buildEquipmentSummary(quote);

  return [nameSection, jobNumber, startTimePart ? `${startTimePart} ${equipmentSummary}` : equipmentSummary]
    .filter(Boolean)
    .join(' – ');
};

const DailyConfirmationModal: React.FC<DailyConfirmationModalProps> = ({ isOpen, onClose }) => {
  const [emailInput, setEmailInput] = useState('');
  const [parsedJobNumbers, setParsedJobNumbers] = useState<string[]>([]);
  const [matchedQuotes, setMatchedQuotes] = useState<SavedQuote[]>([]);
  const [unmatchedNumbers, setUnmatchedNumbers] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmailInput('');
      setParsedJobNumbers([]);
      setMatchedQuotes([]);
      setUnmatchedNumbers([]);
      setGeneratedText('');
      setHasSearched(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const matches = emailInput.match(JOB_NUMBER_REGEX);
    setParsedJobNumbers(matches ? [...new Set(matches)] : []);
  }, [emailInput]);

  const handleMatch = async () => {
    if (parsedJobNumbers.length === 0) return;

    setLoading(true);
    setHasSearched(false);
    try {
      const quotes = await QuoteService.getQuotesByJobNumbers(parsedJobNumbers);
      setMatchedQuotes(quotes);

      const matchedJobNumbers = new Set(
        quotes.map(q => (q.job_number || '').toLowerCase())
      );
      setUnmatchedNumbers(
        parsedJobNumbers.filter(n => !matchedJobNumbers.has(n.toLowerCase()))
      );

      const lines = quotes.map(buildConfirmationLine);
      setGeneratedText(lines.join(',\n'));
      setHasSearched(true);
    } catch (error) {
      console.error('Failed to match quotes:', error);
    } finally {
      setLoading(false);
    }
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
                <p className="text-slate-400">Paste dispatch email to generate confirmation reply</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800/50 rounded-xl transition">
              <X className="h-6 w-6 text-slate-400" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Input Section */}
            <div>
              <label className="block text-lg font-semibold mb-3 text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Paste Dispatch Email
              </label>
              <textarea
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Paste the dispatch email here...&#10;Job numbers like 9237-24, 1261-26 will be detected automatically"
                rows={5}
                className="w-full p-4 rounded-2xl border border-slate-600/50 bg-slate-900/50 text-white placeholder-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/30 transition resize-vertical"
              />

              {/* Parsed Job Number Chips */}
              {parsedJobNumbers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-400 py-1">Found:</span>
                  {parsedJobNumbers.map((num) => (
                    <span
                      key={num}
                      className="inline-flex items-center rounded-full bg-accent/15 border border-accent/30 px-3 py-1 text-sm font-mono font-semibold text-accent"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={handleMatch}
                disabled={loading || parsedJobNumbers.length === 0}
                className="mt-3 flex items-center gap-2 bg-accent text-black px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Truck className="h-5 w-5" />}
                Match Quotes ({parsedJobNumbers.length})
              </button>
            </div>

            {/* Results Section */}
            {hasSearched && matchedQuotes.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                  Matched {matchedQuotes.length} Quote{matchedQuotes.length !== 1 ? 's' : ''}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedQuotes.map((quote) => (
                    <div key={quote.id} className="p-6 rounded-2xl border border-slate-700/50 bg-slate-900/50 hover:border-accent/50 transition">
                      <div className="font-mono text-2xl font-bold text-accent mb-2">{quote.job_number}</div>
                      <div className="text-white font-semibold">{quote.contact_name || quote.project_name}</div>
                      <div className="text-slate-400 text-sm">{quote.company_name}</div>
                      {quote.start_time && (
                        <div className="text-slate-400 text-sm mt-1">{quote.start_time} start</div>
                      )}
                      <div className="text-slate-500 text-xs mt-2 truncate">{buildEquipmentSummary(quote)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched Numbers */}
            {hasSearched && unmatchedNumbers.length > 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">
                    {unmatchedNumbers.length} job number{unmatchedNumbers.length !== 1 ? 's' : ''} not found in Volt
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unmatchedNumbers.map((num) => (
                    <span
                      key={num}
                      className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-sm font-mono text-amber-300"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Output Section */}
            {generatedText && (
              <div>
                <label className="block text-lg font-semibold mb-3 text-white flex items-center gap-2">
                  Reply Text
                  <button onClick={copyToClipboard} className="ml-auto p-2 hover:bg-slate-800 rounded-xl transition">
                    {copied ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5 text-slate-400" />}
                  </button>
                </label>
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  rows={Math.min(matchedQuotes.length + 2, 10)}
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

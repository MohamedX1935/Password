import { useState } from 'react';
import { AnalysisResult, analyzePassword, generatePassword } from '@password/core';
import Card from './ui/Card';

interface HistoryEntry {
  timestamp: number;
  length: number;
  score: number;
  effectiveEntropyBits: number;
  offlineFast: string;
}

const defaultOptions = {
  length: 16,
  includeLowercase: true,
  includeUppercase: true,
  includeDigits: true,
  includeSymbols: true,
  excludeAmbiguous: false,
  noRepeats: true,
  requireEachSelectedType: true
};

export default function Generator() {
  const [options, setOptions] = useState(defaultOptions);
  const [generated, setGenerated] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const updateHistory = (analysisResult: AnalysisResult) => {
    const entry: HistoryEntry = {
      timestamp: Date.now(),
      length: analysisResult.passwordLength,
      score: analysisResult.score,
      effectiveEntropyBits: analysisResult.effectiveEntropyBits,
      offlineFast: analysisResult.crackTimes.offlineFast.formattedTime
    };
    const existing = JSON.parse(localStorage.getItem('history') || '[]') as HistoryEntry[];
    const next = [entry, ...existing].slice(0, 10);
    localStorage.setItem('history', JSON.stringify(next));
  };

  const handleGenerate = () => {
    setError('');
    try {
      const password = generatePassword(options);
      setGenerated(password);
      const analysisResult = analyzePassword(password);
      setAnalysis(analysisResult);
      updateHistory(analysisResult);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
  };

  return (
    <div className="space-y-4">
      <Card title="Paramètres du générateur">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Longueur : {options.length}
            <input
              type="range"
              min={8}
              max={64}
              value={options.length}
              onChange={(e) => setOptions((prev) => ({ ...prev, length: Number(e.target.value) }))}
              className="accent-emerald-500"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeLowercase}
                onChange={(e) => setOptions((prev) => ({ ...prev, includeLowercase: e.target.checked }))}
              />
              Minuscules
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeUppercase}
                onChange={(e) => setOptions((prev) => ({ ...prev, includeUppercase: e.target.checked }))}
              />
              Majuscules
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeDigits}
                onChange={(e) => setOptions((prev) => ({ ...prev, includeDigits: e.target.checked }))}
              />
              Chiffres
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeSymbols}
                onChange={(e) => setOptions((prev) => ({ ...prev, includeSymbols: e.target.checked }))}
              />
              Symboles
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.excludeAmbiguous}
                onChange={(e) => setOptions((prev) => ({ ...prev, excludeAmbiguous: e.target.checked }))}
              />
              Exclure ambigus
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.noRepeats}
                onChange={(e) => setOptions((prev) => ({ ...prev, noRepeats: e.target.checked }))}
              />
              Pas de répétitions
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.requireEachSelectedType}
                onChange={(e) => setOptions((prev) => ({ ...prev, requireEachSelectedType: e.target.checked }))}
              />
              Au moins 1 de chaque
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-3">
          <button
            onClick={handleGenerate}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Générer
          </button>
          <button
            onClick={handleGenerate}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700"
          >
            Régénérer
          </button>
          <button
            onClick={handleCopy}
            disabled={!generated}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
          >
            Copier
          </button>
        </div>
        {generated && (
          <p className="break-all rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm text-emerald-300">{generated}</p>
        )}
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </Card>

      {analysis && (
        <Card title="Analyse immédiate">
          <p className="text-2xl font-bold text-emerald-300">{analysis.score} / 100 — {analysis.strengthLabel}</p>
          <p className="text-sm text-slate-300">
            Entropie brute : {analysis.rawEntropyBits.toFixed(2)} bits — Effective : {analysis.effectiveEntropyBits.toFixed(2)} bits
          </p>
          <p className="text-sm text-slate-400">Offline rapide : {analysis.crackTimes.offlineFast.formattedTime}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
            {analysis.suggestions.map((s) => (
              <li key={s.message}>
                {s.message}
                {s.impactBits ? <span className="text-xs text-emerald-300"> (+{s.impactBits} bits)</span> : null}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

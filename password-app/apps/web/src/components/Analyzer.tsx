import { useMemo, useState } from 'react';
import { AnalysisResult, analyzePassword } from '@password/core';
import Card from './ui/Card';
import { serverAnalyze } from '../lib/api';

export default function Analyzer() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useServer, setUseServer] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => result?.strengthLabel ?? '—', [result]);

  const updateHistory = (analysisResult: AnalysisResult) => {
    const entry = {
      timestamp: Date.now(),
      length: analysisResult.passwordLength,
      score: analysisResult.score,
      effectiveEntropyBits: analysisResult.effectiveEntropyBits,
      offlineFast: analysisResult.crackTimes.offlineFast.formattedTime
    };
    const existing = JSON.parse(localStorage.getItem('history') || '[]') as typeof entry[];
    const next = [entry, ...existing].slice(0, 10);
    localStorage.setItem('history', JSON.stringify(next));
  };

  const handleAnalyze = async () => {
    setError('');
    setLoading(true);
    try {
      if (!password.trim()) {
        setError('Saisis un mot de passe à analyser.');
        return;
      }
      const analysis = useServer ? await serverAnalyze(password) : analyzePassword(password);
      setResult(analysis);
      updateHistory(analysis);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Analyse locale ou côté serveur"
        description="L'analyse locale ne sort jamais le mot de passe de ton navigateur. Côté serveur : HTTPS local, aucune persistance. Ne teste pas de mots de passe sensibles."
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-800 px-3 py-2"
            placeholder="Mot de passe à évaluer"
          />
          <div className="flex gap-2">
            <button
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? 'Masquer' : 'Afficher'}
            </button>
            <button
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
              onClick={() => setUseServer((prev) => !prev)}
            >
              {useServer ? 'Analyse locale' : 'Analyser côté serveur'}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? 'Analyse…' : 'Analyser'}
            </button>
          </div>
        </div>
        {useServer && <p className="text-xs text-amber-300">Ne teste pas de mots de passe sensibles. Transmission HTTPS locale uniquement.</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </Card>

      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Score et entropie">
            <p className="text-4xl font-bold text-emerald-300">{result.score} / 100</p>
            <p className="text-sm text-slate-300">Label : {passwordStrength}</p>
            <p className="text-sm text-slate-300">
              Entropie brute : {result.rawEntropyBits.toFixed(2)} bits — Entropie effective : {result.effectiveEntropyBits.toFixed(2)} bits
            </p>
            <p className="text-sm text-slate-400">Pénalités : -{result.penaltiesBits.toFixed(2)} bits</p>
            <p className="text-xs text-slate-500">Jeu de caractères : {result.characterSetSize} — Diversité : {(result.diversityRatio * 100).toFixed(0)}%</p>
          </Card>

          <Card title="Critères et patterns">
            <ul className="space-y-1 text-sm">
              <li>Longueur : {result.passwordLength} caractères</li>
              <li>Minuscules : {result.categories.hasLowercase ? 'oui' : 'non'} — Majuscules : {result.categories.hasUppercase ? 'oui' : 'non'}</li>
              <li>Chiffres : {result.categories.hasDigits ? 'oui' : 'non'} — Symboles : {result.categories.hasSymbols ? 'oui' : 'non'}</li>
            </ul>
            <div>
              <p className="text-sm font-semibold text-slate-200">Patterns détectés</p>
              <ul className="list-disc pl-4 text-sm text-slate-300">
                {result.detectedPatterns.length === 0 && <li>Aucun pattern risqué détecté.</li>}
                {result.detectedPatterns.map((pattern) => (
                  <li key={pattern.message + pattern.penaltyBits}>
                    {pattern.message} ({pattern.penaltyBits} bits)
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="Temps estimé (scénarios)">
            <ul className="space-y-1 text-sm text-slate-200">
              <li>Offline rapide (10^10 g/s) : {result.crackTimes.offlineFast.formattedTime}</li>
              <li>Offline moyen (10^8 g/s) : {result.crackTimes.offlineMedium.formattedTime}</li>
              <li>Online limité (10 g/s) : {result.crackTimes.onlineLimited.formattedTime}</li>
            </ul>
            <p className="text-xs text-slate-400">Toujours une estimation, non une durée exacte.</p>
          </Card>

          <Card title="Suggestions personnalisées">
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
              {result.suggestions.map((s) => (
                <li key={s.message}>
                  {s.message}
                  {s.impactBits ? <span className="text-xs text-emerald-300"> (impact estimé +{s.impactBits} bits)</span> : null}
                </li>
              ))}
            </ul>
            <div className="text-xs text-slate-400">
              {result.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

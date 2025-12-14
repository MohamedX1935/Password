import { useMemo, useState } from 'react';
import { useToggle } from './useToggle';
import { useMutation } from '@tanstack/react-query';
import { analyzeAndEstimate } from '@password/core';

export function PasswordAnalyzer({
  onAddHistory,
  analyzeLocal,
  analyzeMutation
}: {
  onAddHistory: (entry: any) => void;
  analyzeLocal: (password: string) => any;
  analyzeMutation: ReturnType<typeof useMutation>;
}) {
  const [password, setPassword] = useState('');
  const [show, toggleShow] = useToggle(false);
  const [serverMode, toggleServerMode] = useToggle(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    try {
      const res = serverMode
        ? await analyzeMutation.mutateAsync(password)
        : analyzeLocal(password);
      setResult(res);
      onAddHistory({
        date: new Date().toISOString(),
        length: password.length,
        score: res.analysis.score,
        entropy: res.analysis.effectiveEntropyBits,
        time: res.crackTimes.offlineFast.formattedTime
      });
    } catch (e: any) {
      setError(e.message || 'Erreur');
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded border border-gray-800 bg-gray-900 p-4">
        <label className="block text-sm font-semibold">Mot de passe</label>
        <div className="flex gap-2">
          <input
            type={show ? 'text' : 'password'}
            className="w-full rounded bg-gray-800 p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrer un mot de passe à tester"
          />
          <button className="rounded bg-gray-700 px-2" onClick={toggleShow}>
            {show ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={serverMode} onChange={toggleServerMode} />
            Analyse côté serveur
          </label>
          <span className="text-xs text-amber-400">Ne teste pas de mots de passe sensibles.</span>
        </div>
        <button
          onClick={handleAnalyze}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
        >
          Analyser
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
      <div className="space-y-3 rounded border border-gray-800 bg-gray-900 p-4">
        <h3 className="text-lg font-semibold">Résultats</h3>
        {!result ? (
          <p className="text-sm text-gray-400">Aucun résultat pour le moment.</p>
        ) : (
          <ResultDisplay result={result} />
        )}
      </div>
    </div>
  );
}

function ResultDisplay({ result }: { result: any }) {
  const { analysis, crackTimes } = result;
  const criteria = [
    { label: 'Longueur', value: analysis.length >= 12 ? 'OK' : 'Courte' },
    { label: 'Minuscules', value: analysis.categories.hasLowercase ? 'Oui' : 'Non' },
    { label: 'Majuscules', value: analysis.categories.hasUppercase ? 'Oui' : 'Non' },
    { label: 'Chiffres', value: analysis.categories.hasDigits ? 'Oui' : 'Non' },
    { label: 'Symboles', value: analysis.categories.hasSymbols ? 'Oui' : 'Non' },
    { label: 'Diversité', value: `${analysis.uniqueCharCount} uniques` }
  ];

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-gray-400">Score</p>
          <p className="text-2xl font-semibold">{analysis.score}/100</p>
        </div>
        <span className="rounded bg-gray-800 px-3 py-1 text-sm font-semibold">{analysis.strengthLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Info label="Entropie brute" value={`${analysis.rawEntropyBits.toFixed(1)} bits`} />
        <Info label="Entropie effective" value={`${analysis.effectiveEntropyBits.toFixed(1)} bits`} />
        <Info label="Jeu de caractères" value={`${analysis.characterSetSize}`} />
        <Info label="Pénalités" value={`-${analysis.penaltiesBits.toFixed(1)} bits`} />
      </div>
      <div>
        <p className="font-semibold">Critères</p>
        <ul className="grid grid-cols-2 gap-1 text-gray-300">
          {criteria.map((c) => (
            <li key={c.label} className="rounded bg-gray-800 px-2 py-1">
              <span className="font-semibold">{c.label}:</span> {c.value}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-semibold">Patterns détectés</p>
        {analysis.detectedPatterns.length === 0 ? (
          <p className="text-gray-400">Aucun motif pénalisant détecté.</p>
        ) : (
          <ul className="space-y-1">
            {analysis.detectedPatterns.map((p: any, idx: number) => (
              <li key={idx} className="rounded bg-gray-800 px-2 py-1">
                {p.message} (-{p.penaltyBits} bits)
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="font-semibold">Temps estimé</p>
        <table className="w-full text-left text-gray-200">
          <thead>
            <tr>
              <th className="pb-1">Scénario</th>
              <th className="pb-1">Vitesse</th>
              <th className="pb-1">Temps</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(crackTimes).map(([key, value]: any) => (
              <tr key={key} className="border-t border-gray-800">
                <td className="py-1 text-sm">{key}</td>
                <td className="py-1 text-sm">{value.guessesPerSecond.toLocaleString()} g/s</td>
                <td className="py-1 text-sm">{value.formattedTime} (estimation)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <p className="font-semibold">Suggestions personnalisées</p>
        <ul className="list-disc space-y-1 pl-5 text-gray-300">
          {analysis.suggestions.map((s: string, idx: number) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-gray-400">Estimation pédagogique, pas une durée exacte.</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-gray-800 px-2 py-1">
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

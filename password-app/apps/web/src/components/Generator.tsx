import { useEffect, useState } from 'react';
import { GeneratorOptions } from '@password/core';
import { useToggle } from './useToggle';
import { useMutation } from '@tanstack/react-query';

const defaultOptions: GeneratorOptions = {
  length: 16,
  includeLowercase: true,
  includeUppercase: true,
  includeDigits: true,
  includeSymbols: true,
  excludeAmbiguous: false,
  noRepeats: true,
  requireEachSelectedType: true
};

export function Generator({
  analyzeLocal,
  generateMutation,
  onAddHistory
}: {
  analyzeLocal: (password: string) => any;
  generateMutation: ReturnType<typeof useMutation>;
  onAddHistory: (entry: any) => void;
}) {
  const [options, setOptions] = useState<GeneratorOptions>(defaultOptions);
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [serverMode, toggleServerMode] = useToggle(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (password) {
      const res = analyzeLocal(password);
      setResult(res);
    }
  }, [password]);

  const handleGenerate = async () => {
    setError(null);
    try {
      if (serverMode) {
        const res = await generateMutation.mutateAsync(options);
        setPassword(res.password);
        setResult(res);
        onAddHistory({
          date: new Date().toISOString(),
          length: res.password.length,
          score: res.analysis.score,
          entropy: res.analysis.effectiveEntropyBits,
          time: res.crackTimes.offlineFast.formattedTime
        });
      } else {
        const local = (await import('@password/core')).generateWithAnalysis(options);
        setPassword(local.password);
        setResult(local);
        onAddHistory({
          date: new Date().toISOString(),
          length: local.password.length,
          score: local.analysis.score,
          entropy: local.analysis.effectiveEntropyBits,
          time: local.crackTimes.offlineFast.formattedTime
        });
      }
    } catch (e: any) {
      setError(e.message || 'Erreur');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
  };

  const toggleOption = (key: keyof GeneratorOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] } as GeneratorOptions));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded border border-gray-800 bg-gray-900 p-4">
        <h3 className="text-lg font-semibold">Paramètres</h3>
        <label className="flex items-center gap-2 text-sm">
          Longueur
          <input
            type="number"
            min={8}
            max={64}
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
            className="w-20 rounded bg-gray-800 p-1"
          />
        </label>
        {(
          [
            ['includeLowercase', 'Minuscules'],
            ['includeUppercase', 'Majuscules'],
            ['includeDigits', 'Chiffres'],
            ['includeSymbols', 'Symboles'],
            ['excludeAmbiguous', 'Exclure O/0/l/1/I'],
            ['noRepeats', 'Pas de répétitions consécutives'],
            ['requireEachSelectedType', 'Exiger chaque catégorie']
          ] as [keyof GeneratorOptions, string][]
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(options[key])} onChange={() => toggleOption(key)} /> {label}
          </label>
        ))}
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={serverMode} onChange={toggleServerMode} />
            Générer côté serveur
          </label>
          <span className="text-xs text-amber-400">Estimation pédagogique</span>
        </div>
        <div className="flex gap-2">
          <button className="rounded bg-blue-600 px-4 py-2" onClick={handleGenerate}>
            Générer
          </button>
          <button className="rounded bg-gray-700 px-4 py-2" onClick={handleGenerate}>
            Régénérer
          </button>
          <button className="rounded bg-green-700 px-4 py-2" onClick={handleCopy} disabled={!password}>
            Copier
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div>
          <p className="text-xs text-gray-400">Mot de passe généré (non stocké) :</p>
          <p className="truncate rounded bg-gray-800 p-2 font-mono">{password || '---'}</p>
        </div>
      </div>
      <div className="space-y-3 rounded border border-gray-800 bg-gray-900 p-4">
        <h3 className="text-lg font-semibold">Analyse</h3>
        {!result ? (
          <p className="text-sm text-gray-400">Génère un mot de passe pour voir l'analyse.</p>
        ) : (
          <pre className="whitespace-pre-wrap rounded bg-gray-800 p-3 text-xs text-gray-100">
            {JSON.stringify({
              score: result.analysis.score,
              entropie: result.analysis.effectiveEntropyBits.toFixed(1),
              label: result.analysis.strengthLabel,
              suggestions: result.analysis.suggestions,
              temps: result.crackTimes
            }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

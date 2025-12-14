import { useEffect, useState } from 'react';
import Card from './ui/Card';

interface HistoryEntry {
  timestamp: number;
  length: number;
  score: number;
  effectiveEntropyBits: number;
  offlineFast: string;
}

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('history') || '[]') as HistoryEntry[];
    setEntries(stored);
  }, []);

  const clear = () => {
    localStorage.removeItem('history');
    setEntries([]);
  };

  return (
    <Card title="Historique local" description="Résumé stocké uniquement en localStorage (jamais le mot de passe).">
      {entries.length === 0 && <p className="text-sm text-slate-300">Aucun historique pour le moment.</p>}
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.timestamp} className="rounded border border-slate-800 bg-slate-900/60 p-3 text-sm">
            <p className="text-slate-200">{new Date(entry.timestamp).toLocaleString()}</p>
            <p className="text-slate-300">Longueur : {entry.length} — Score : {entry.score} — Entropie effective : {entry.effectiveEntropyBits.toFixed(2)} bits</p>
            <p className="text-slate-400">Offline rapide : {entry.offlineFast}</p>
          </li>
        ))}
      </ul>
      {entries.length > 0 && (
        <button onClick={clear} className="mt-3 rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-rose-400">
          Effacer
        </button>
      )}
    </Card>
  );
}

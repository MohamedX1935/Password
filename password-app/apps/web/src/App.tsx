import { useState } from 'react';
import { analyzeAndEstimate, GeneratorOptions } from '@password/core';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { PasswordAnalyzer } from './components/PasswordAnalyzer';
import { Generator } from './components/Generator';
import { History } from './components/History';
import { Method } from './components/Method';

const analyzeSchema = z.object({ password: z.string() });

const tabs = [
  { key: 'analyze', label: 'Analyse' },
  { key: 'generate', label: 'Générateur' },
  { key: 'history', label: 'Historique' },
  { key: 'method', label: 'Méthode' }
] as const;

type TabKey = (typeof tabs)[number]['key'];

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('analyze');
  const [history, setHistory] = useState(() => {
    const raw = localStorage.getItem('history');
    return raw ? JSON.parse(raw) : [];
  });

  const saveHistory = (entry: any) => {
    const next = [entry, ...history].slice(0, 10);
    setHistory(next);
    localStorage.setItem('history', JSON.stringify(next));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.setItem('history', JSON.stringify([]));
  };

  const analyzeMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!response.ok) throw new Error('Erreur serveur');
      return response.json();
    }
  });

  const generateMutation = useMutation({
    mutationFn: async (options: GeneratorOptions) => {
      const response = await fetch(`${apiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      if (!response.ok) throw new Error('Erreur serveur');
      return response.json();
    }
  });

  const analyzeLocal = (password: string) => {
    const parsed = analyzeSchema.safeParse({ password });
    if (!parsed.success) throw new Error('Mot de passe requis');
    return analyzeAndEstimate(password);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 p-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold">Password Lab</h1>
          <p className="text-sm text-gray-400">
            Estimation pédagogique de robustesse. Ne teste pas de mots de passe sensibles.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <div className="mb-4 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded px-3 py-2 text-sm font-medium ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'analyze' && (
          <PasswordAnalyzer
            onAddHistory={saveHistory}
            analyzeLocal={analyzeLocal}
            analyzeMutation={analyzeMutation}
          />
        )}
        {activeTab === 'generate' && (
          <Generator
            analyzeLocal={analyzeLocal}
            generateMutation={generateMutation}
            onAddHistory={saveHistory}
          />
        )}
        {activeTab === 'history' && <History history={history} onClear={clearHistory} />}
        {activeTab === 'method' && <Method />}
      </main>
    </div>
  );
}

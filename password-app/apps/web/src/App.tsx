import { useState } from 'react';
import Analyzer from './components/Analyzer';
import Generator from './components/Generator';
import History from './components/History';
import Method from './components/Method';

const tabs = [
  { id: 'analyzer', label: 'Analyse' },
  { id: 'generator', label: 'Générateur' },
  { id: 'history', label: 'Historique' },
  { id: 'method', label: 'Méthode' }
] as const;

type TabId = (typeof tabs)[number]['id'];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('analyzer');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex flex-col gap-4 pb-6">
        <div>
          <p className="text-sm text-emerald-300">Estimation pédagogique</p>
          <h1 className="text-3xl font-bold text-white">Password Lab</h1>
          <p className="text-sm text-slate-300">
            Analyse avancée, générateur sécurisé et rappels éducatifs. Aucune donnée sensible n'est stockée.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'analyzer' && <Analyzer />}
      {activeTab === 'generator' && <Generator />}
      {activeTab === 'history' && <History />}
      {activeTab === 'method' && <Method />}
    </div>
  );
}

export default App;

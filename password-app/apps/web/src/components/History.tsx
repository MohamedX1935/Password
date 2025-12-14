export function History({ history, onClear }: { history: any[]; onClear: () => void }) {
  return (
    <div className="space-y-3 rounded border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historique local (10 max)</h3>
        <button className="rounded bg-red-700 px-3 py-1 text-sm" onClick={onClear}>
          Effacer
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-gray-400">Aucune entrée. Rien n'est stocké côté serveur.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {history.map((item: any, idx: number) => (
            <li key={idx} className="flex flex-wrap items-center justify-between rounded bg-gray-800 px-2 py-1">
              <div className="space-y-1">
                <p className="text-gray-200">{new Date(item.date).toLocaleString()}</p>
                <p className="text-gray-400">Longueur: {item.length} - Score: {item.score}</p>
              </div>
              <div className="text-right text-gray-300">
                <p>Entropie effective: {item.entropy.toFixed?.(1) || item.entropy} bits</p>
                <p>Offline rapide: {item.time} (estimation)</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Method() {
  return (
    <div className="space-y-3 rounded border border-gray-800 bg-gray-900 p-4 text-sm text-gray-200">
      <h3 className="text-lg font-semibold">Méthode et limites</h3>
      <p>
        Cette application estime la robustesse en calculant une entropie brute basée sur le jeu de caractères
        détecté, puis applique des pénalités pour des motifs faciles (mots courants, suites, dates). Le score est
        proportionnel à l&apos;entropie effective.
      </p>
      <p>
        Les temps de cassage sont des estimations mathématiques basées sur un modèle moyen : 1e10 essais/s
        (offline rapide), 1e8 essais/s (offline moyen), 10 essais/s (online limité). Les attaques réelles peuvent
        être plus rapides ou plus lentes. Ne pas utiliser pour des mots de passe sensibles.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Aucune donnée n&apos;est stockée côté serveur.</li>
        <li>L&apos;historique local ne conserve que des métriques, pas les mots de passe.</li>
        <li>Les suggestions sont pédagogiques et non garanties.</li>
      </ul>
      <p className="text-xs text-gray-400">Estimation pédagogique, pas une durée exacte.</p>
    </div>
  );
}

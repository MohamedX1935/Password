import Card from './ui/Card';

export default function Method() {
  return (
    <div className="space-y-4">
      <Card title="Méthodologie pédagogique">
        <p className="text-sm text-slate-200">
          L'entropie brute est calculée comme longueur × log2(taille du jeu de caractères). Des pénalités s'appliquent pour les
          suites simples, répétitions, mots courants, dates ou faible diversité. L'entropie effective est plafonnée si un mot
          courant est détecté.
        </p>
        <p className="text-sm text-slate-200">
          Les temps de cassage affichés sont des estimations : guesses ≈ 2^(entropie effective - 1). Scénarios : offline rapide
          10^10 guesses/s, offline moyen 10^8 guesses/s, online limité 10 guesses/s. Jamais une durée exacte.
        </p>
        <p className="text-sm text-slate-200">
          Aucun mot de passe n'est stocké ni envoyé sans action explicite. L'historique ne contient qu'un résumé anonymisé.
        </p>
        <p className="text-sm text-amber-300">
          Outil strictement éducatif. Ne pas utiliser pour des activités illégales ou pour tester des mots de passe sensibles.
        </p>
      </Card>
    </div>
  );
}

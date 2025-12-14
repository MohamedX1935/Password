/**
 * Securely generate random integers within [0, max).
 */
export function secureRandomIndices(max: number, count: number): number[] {
  if (max <= 0 || count <= 0) return [];
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error('Génération sécurisée indisponible dans cet environnement.');
  }

  const array = new Uint32Array(count);
  cryptoObj.getRandomValues(array);
  const results: number[] = [];
  for (let i = 0; i < count; i += 1) {
    results.push(array[i] % max);
  }
  return results;
}

export function secureShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const [randIndex] = secureRandomIndices(i + 1, 1);
    [arr[i], arr[randIndex]] = [arr[randIndex], arr[i]];
  }
  return arr;
}

export function log2(value: number): number {
  return Math.log(value) / Math.log(2);
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 1) return '< 1 seconde (estimation)';
  const units = [
    { label: 'seconde', value: 1 },
    { label: 'minute', value: 60 },
    { label: 'heure', value: 3600 },
    { label: 'jour', value: 86400 },
    { label: 'mois', value: 2629800 },
    { label: 'an', value: 31557600 }
  ];

  for (let i = units.length - 1; i >= 0; i -= 1) {
    const { label, value } = units[i];
    if (seconds >= value) {
      const amount = Math.round(seconds / value);
      if (amount > 5000 && label === 'an') return 'plusieurs milliers d\'années (estimation)';
      const plural = amount > 1 ? 's' : '';
      return `${amount} ${label}${plural} (estimation)`;
    }
  }
  return 'quelques secondes (estimation)';
}

import { webcrypto as nodeCrypto } from 'crypto';

export type AnalysisResult = {
  length: number;
  categories: {
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasDigits: boolean;
    hasSymbols: boolean;
  };
  characterSetSize: number;
  uniqueCharCount: number;
  diversityRatio: number;
  rawEntropyBits: number;
  penaltiesBits: number;
  effectiveEntropyBits: number;
  strengthLabel: StrengthLabel;
  score: number;
  detectedPatterns: DetectedPattern[];
  suggestions: string[];
  notes: string[];
};

export type DetectedPattern = {
  type: string;
  message: string;
  penaltyBits: number;
};

export type CrackTime = {
  guessesPerSecond: number;
  timeSeconds: number;
  formattedTime: string;
};

export type CrackTimes = {
  offlineFast: CrackTime;
  offlineMedium: CrackTime;
  onlineLimited: CrackTime;
};

export type StrengthLabel =
  | 'Très faible'
  | 'Faible'
  | 'Moyen'
  | 'Fort'
  | 'Très fort';

export type GeneratorOptions = {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
  excludeAmbiguous?: boolean;
  noRepeats?: boolean;
  requireEachSelectedType?: boolean;
};

const commonWords = ['password', 'motdepasse', 'qwerty', 'azerty', 'welcome', 'admin', 'letmein', 'football', 'monkey'];

const leetMap: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '$': 's',
  '5': 's',
  '7': 't'
};

const symbols = "!@#$%^&*()-_=+[]{};:'\"\\|,.<>/?`~";

export function analyzePassword(password: string): AnalysisResult {
  const length = password.length;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);
  const characterSetSize = (hasLowercase ? 26 : 0) + (hasUppercase ? 26 : 0) + (hasDigits ? 10 : 0) + (hasSymbols ? symbols.length : 0);
  const uniqueCharCount = new Set(password.split('')).size;
  const diversityRatio = characterSetSize === 0 ? 0 : uniqueCharCount / Math.max(length, 1);

  const { patterns, penaltyBits } = detectPatterns(password);
  const entropy = calculateEntropy(password, characterSetSize || 1, penaltyBits, patterns);
  const { score, label } = scoreFromEntropy(entropy.effectiveEntropyBits);
  const suggestions = generateSuggestions({
    length,
    categories: { hasLowercase, hasUppercase, hasDigits, hasSymbols },
    uniqueCharCount,
    diversityRatio,
    strengthLabel: label,
    score,
    penaltiesBits: penaltyBits,
    effectiveEntropyBits: entropy.effectiveEntropyBits,
    detectedPatterns: patterns
  });

  return {
    length,
    categories: { hasLowercase, hasUppercase, hasDigits, hasSymbols },
    characterSetSize,
    uniqueCharCount,
    diversityRatio,
    rawEntropyBits: entropy.rawEntropyBits,
    penaltiesBits: entropy.penaltiesBits,
    effectiveEntropyBits: entropy.effectiveEntropyBits,
    strengthLabel: label,
    score,
    detectedPatterns: patterns,
    suggestions,
    notes: ['Résultat indicatif', 'Estimation pédagogique, pas une durée exacte']
  };
}

export function detectPatterns(password: string): { patterns: DetectedPattern[]; penaltyBits: number } {
  const patterns: DetectedPattern[] = [];
  let penaltyBits = 0;

  if (!password) {
    return { patterns, penaltyBits };
  }

  if (/^(.)\1{3,}/.test(password)) {
    patterns.push({ type: 'repetition', message: 'Répétitions longues détectées', penaltyBits: 10 });
    penaltyBits += 10;
  }

  if (/(.{2,})\1{2,}/.test(password)) {
    patterns.push({ type: 'repeatedPattern', message: 'Motif répété identifié', penaltyBits: 8 });
    penaltyBits += 8;
  }

  if (/(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(password)) {
    patterns.push({ type: 'sequence', message: 'Suite numérique simple', penaltyBits: 12 });
    penaltyBits += 12;
  }

  if (/(abcd|bcde|cdef|defg|gfed|fedc|edcb|zyx|cba)/i.test(password)) {
    patterns.push({ type: 'alphaSequence', message: 'Suite alphabétique', penaltyBits: 10 });
    penaltyBits += 10;
  }

  const normalized = password
    .toLowerCase()
    .split('')
    .map((c) => leetMap[c] ?? c)
    .join('');
  if (commonWords.some((w) => normalized.includes(w))) {
    patterns.push({ type: 'commonWord', message: 'Mot courant ou variante leet détecté', penaltyBits: 25 });
    penaltyBits += 25;
  }

  if (/(19\d{2}|20[0-2]\d)[^\d]?((0?[1-9])|(1[0-2]))?/.test(password)) {
    patterns.push({ type: 'date', message: 'Date probable détectée', penaltyBits: 8 });
    penaltyBits += 8;
  }

  return { patterns, penaltyBits };
}

export function calculateEntropy(
  password: string,
  characterSetSize: number,
  basePenaltyBits: number,
  patterns: DetectedPattern[]
): { rawEntropyBits: number; penaltiesBits: number; effectiveEntropyBits: number } {
  const rawEntropyBits = password.length * Math.log2(characterSetSize);
  let penaltiesBits = basePenaltyBits;

  const commonWordPattern = patterns.find((p) => p.type === 'commonWord');
  if (commonWordPattern) {
    penaltiesBits += rawEntropyBits > 15 ? rawEntropyBits - 15 : 0;
  }

  const repeated = patterns.find((p) => p.type === 'repetition' || p.type === 'repeatedPattern');
  if (repeated) {
    penaltiesBits += 5;
  }

  const effectiveEntropyBits = Math.max(rawEntropyBits - penaltiesBits, 1);
  return { rawEntropyBits, penaltiesBits, effectiveEntropyBits };
}

export function scoreFromEntropy(effectiveEntropyBits: number): { score: number; label: StrengthLabel } {
  let label: StrengthLabel;
  if (effectiveEntropyBits < 28) label = 'Très faible';
  else if (effectiveEntropyBits < 36) label = 'Faible';
  else if (effectiveEntropyBits < 60) label = 'Moyen';
  else if (effectiveEntropyBits < 80) label = 'Fort';
  else label = 'Très fort';

  const score = Math.max(0, Math.min(100, Math.round((effectiveEntropyBits / 100) * 120)));
  return { score, label };
}

export function estimateCrackTimes(effectiveEntropyBits: number): CrackTimes {
  const guessesMean = Math.pow(2, Math.max(effectiveEntropyBits - 1, 0));
  const scenarios = [
    { key: 'offlineFast', gps: 1e10 },
    { key: 'offlineMedium', gps: 1e8 },
    { key: 'onlineLimited', gps: 10 }
  ];

  const result: Partial<CrackTimes> = {};
  scenarios.forEach((scenario) => {
    const timeSeconds = guessesMean / scenario.gps;
    (result as any)[scenario.key] = {
      guessesPerSecond: scenario.gps,
      timeSeconds,
      formattedTime: formatTime(timeSeconds)
    };
  });

  return result as CrackTimes;
}

export function formatTime(seconds: number): string {
  if (seconds < 1) return '< 1 seconde';
  if (seconds < 10) return 'quelques secondes';
  if (seconds < 60) return `${Math.round(seconds)} secondes`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} heures`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)} jours`;
  const months = days / 30;
  if (months < 24) return `${Math.round(months)} mois`;
  const years = months / 12;
  if (years < 1000) return `${Math.round(years)} ans`;
  return 'plusieurs milliers d\'années';
}

export function generateSuggestions(data: {
  length: number;
  categories: AnalysisResult['categories'];
  uniqueCharCount: number;
  diversityRatio: number;
  strengthLabel: StrengthLabel;
  score: number;
  penaltiesBits: number;
  effectiveEntropyBits: number;
  detectedPatterns: DetectedPattern[];
}): string[] {
  const suggestions: { message: string; impact: number }[] = [];

  if (data.length < 12) {
    suggestions.push({ message: 'Augmente la longueur vers 12-16+ caractères', impact: 10 });
  }

  if (!data.categories.hasUppercase) {
    suggestions.push({ message: 'Ajoute une ou deux majuscules au milieu', impact: 5 });
  }

  if (!data.categories.hasSymbols) {
    suggestions.push({ message: 'Ajoute 1-2 symboles non en fin de chaîne', impact: 8 });
  }

  if (!data.categories.hasDigits) {
    suggestions.push({ message: 'Incorpore un chiffre imprévisible', impact: 6 });
  }

  if (data.uniqueCharCount < data.length * 0.7) {
    suggestions.push({ message: 'Augmente la diversité de caractères uniques', impact: 6 });
  }

  if (data.detectedPatterns.some((p) => p.type === 'commonWord')) {
    suggestions.push({ message: 'Évite les mots courants ou leurs variantes', impact: 15 });
  }

  if (data.detectedPatterns.some((p) => p.type === 'sequence')) {
    suggestions.push({ message: 'Remplace les suites simples par des combinaisons imprévisibles', impact: 12 });
  }

  if (data.detectedPatterns.some((p) => p.type === 'date')) {
    suggestions.push({ message: 'Évite les dates ou informations personnelles', impact: 8 });
  }

  suggestions.push({ message: 'Envisage une passphrase de plusieurs mots uniques', impact: 12 });

  return suggestions
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 8)
    .map((s) => `${s.message} (impact estimé +${s.impact} bits)`);
}

function getCrypto(): Crypto {
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto as Crypto;
  }
  return nodeCrypto as unknown as Crypto;
}

function secureRandomInt(max: number): number {
  const cryptoObj = getCrypto();
  const array = new Uint32Array(1);
  cryptoObj.getRandomValues(array);
  return array[0] % max;
}

export function generatePassword(options: GeneratorOptions): string {
  const {
    length,
    includeLowercase,
    includeUppercase,
    includeDigits,
    includeSymbols,
    excludeAmbiguous,
    noRepeats,
    requireEachSelectedType
  } = options;

  if (length < 8 || length > 64) {
    throw new Error('Longueur invalide (8-64)');
  }

  const pools: { key: keyof AnalysisResult['categories']; chars: string }[] = [];
  const ambiguous = ['O', '0', 'l', '1', 'I'];
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbolChars = symbols;

  if (includeLowercase) pools.push({ key: 'hasLowercase', chars: lower });
  if (includeUppercase) pools.push({ key: 'hasUppercase', chars: upper });
  if (includeDigits) pools.push({ key: 'hasDigits', chars: digits });
  if (includeSymbols) pools.push({ key: 'hasSymbols', chars: symbolChars });

  if (pools.length === 0) {
    throw new Error('Aucune catégorie sélectionnée');
  }

  const adjustedPools = pools.map((pool) => {
    let chars = pool.chars;
    if (excludeAmbiguous) {
      chars = chars
        .split('')
        .filter((c) => !ambiguous.includes(c))
        .join('');
    }
    return { ...pool, chars };
  });

  const requiredChars: string[] = [];
  if (requireEachSelectedType) {
    adjustedPools.forEach((pool) => {
      requiredChars.push(pool.chars[secureRandomInt(pool.chars.length)]);
    });
  }

  const allChars = adjustedPools.map((p) => p.chars).join('');
  const passwordChars: string[] = [...requiredChars];
  while (passwordChars.length < length) {
    const next = allChars[secureRandomInt(allChars.length)];
    if (noRepeats && passwordChars[passwordChars.length - 1] === next) continue;
    passwordChars.push(next);
  }

  // Secure shuffle Fisher-Yates using crypto
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

export function analyzeAndEstimate(password: string) {
  const analysis = analyzePassword(password);
  const crackTimes = estimateCrackTimes(analysis.effectiveEntropyBits);
  return { analysis, crackTimes, suggestions: analysis.suggestions };
}

export function generateWithAnalysis(options: GeneratorOptions) {
  const password = generatePassword(options);
  const { analysis, crackTimes, suggestions } = analyzeAndEstimate(password);
  return { password, analysis, crackTimes, suggestions };
}

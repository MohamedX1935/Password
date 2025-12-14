import { formatTime, log2 } from './common';
import {
  AnalysisResult,
  CategoryUsage,
  CrackScenario,
  CrackTimes,
  PatternFinding,
  Suggestion
} from './types';

const COMMON_WORDS = ['password', 'admin', 'azerty', 'qwerty', 'welcome', 'letmein', '123456', 'monkey'];
const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '@': 'a',
  '3': 'e',
  '1': 'l',
  '!': 'i',
  '$': 's',
  '5': 's'
};

function normalizeLeet(input: string): string {
  return input
    .split('')
    .map((char) => LEET_MAP[char.toLowerCase()] ?? char)
    .join('')
    .toLowerCase();
}

function computeCategories(password: string): CategoryUsage {
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  return { hasLowercase, hasUppercase, hasDigits, hasSymbols };
}

function characterSetSize(categories: CategoryUsage): number {
  let size = 0;
  if (categories.hasLowercase) size += 26;
  if (categories.hasUppercase) size += 26;
  if (categories.hasDigits) size += 10;
  if (categories.hasSymbols) size += 32; // approximate common symbol set
  return size;
}

function detectRepeatingPatterns(password: string): PatternFinding[] {
  const findings: PatternFinding[] = [];
  const repeatCharMatch = /(.)\1{3,}/.exec(password);
  if (repeatCharMatch) {
    findings.push({
      type: 'repetition',
      message: 'Séquence répétée détectée',
      penaltyBits: 12,
      match: repeatCharMatch[0]
    });
  }

  const repeatedSubstr = findRepeatedSubstring(password);
  if (repeatedSubstr) {
    findings.push({
      type: 'repetition',
      message: 'Motif répété (ababab) détecté',
      penaltyBits: 10,
      match: repeatedSubstr
    });
  }
  return findings;
}

function findRepeatedSubstring(password: string): string | null {
  for (let len = 2; len <= password.length / 2; len += 1) {
    const chunk = password.slice(0, len);
    const repeated = chunk.repeat(Math.floor(password.length / len));
    if (repeated.startsWith(password)) {
      return chunk;
    }
  }
  return null;
}

function detectSequences(password: string): PatternFinding[] {
  const findings: PatternFinding[] = [];
  const sequences = ['abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '0123456789'];
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i += 1) {
      const forward = seq.slice(i, i + 3);
      const backward = forward.split('').reverse().join('');
      if (password.includes(forward) || password.includes(backward)) {
        findings.push({
          type: 'sequence',
          message: 'Suite simple détectée',
          penaltyBits: 10,
          match: password.includes(forward) ? forward : backward
        });
        return findings;
      }
    }
  }
  return findings;
}

function detectCommonWords(password: string): PatternFinding[] {
  const normalized = password.toLowerCase();
  const findings: PatternFinding[] = [];
  for (const word of COMMON_WORDS) {
    if (normalized.includes(word)) {
      findings.push({
        type: 'common-word',
        message: 'Mot de passe ou mot courant détecté',
        penaltyBits: 30,
        match: word
      });
      break;
    }
  }
  const leetNormalized = normalizeLeet(password);
  for (const word of COMMON_WORDS) {
    if (leetNormalized.includes(word) && !findings.length) {
      findings.push({
        type: 'leet-common',
        message: 'Mot courant détecté via écriture leet',
        penaltyBits: 28,
        match: word
      });
      break;
    }
  }
  return findings;
}

function detectDates(password: string): PatternFinding[] {
  const findings: PatternFinding[] = [];
  const yearRegex = /(19|20)\d{2}/;
  if (yearRegex.test(password)) {
    findings.push({
      type: 'date',
      message: 'Année ou date probable détectée',
      penaltyBits: 12
    });
  }
  const compactDate = /(\d{2})(\d{2})(\d{2,4})/;
  if (compactDate.test(password)) {
    findings.push({
      type: 'date',
      message: 'Format de date compact détecté',
      penaltyBits: 8
    });
  }
  return findings;
}

function detectDiversityPenalty(password: string): PatternFinding[] {
  const unique = new Set(password.split(''));
  if (unique.size / Math.max(password.length, 1) < 0.4) {
    return [
      {
        type: 'diversity',
        message: 'Faible diversité de caractères',
        penaltyBits: 6
      }
    ];
  }
  return [];
}

export function detectPatterns(password: string): { patterns: PatternFinding[]; penaltyBits: number } {
  const patterns = [
    ...detectRepeatingPatterns(password),
    ...detectSequences(password),
    ...detectCommonWords(password),
    ...detectDates(password),
    ...detectDiversityPenalty(password)
  ];
  const penaltyBits = patterns.reduce((sum, p) => sum + p.penaltyBits, 0);
  return { patterns, penaltyBits };
}

function capIfCommonWord(effectiveEntropyBits: number, patterns: PatternFinding[]): number {
  if (patterns.some((p) => p.type === 'common-word' || p.type === 'leet-common')) {
    return Math.min(effectiveEntropyBits, 15);
  }
  return effectiveEntropyBits;
}

function scoreFromEntropy(effectiveEntropyBits: number): { score: number; label: AnalysisResult['strengthLabel'] } {
  let label: AnalysisResult['strengthLabel'] = 'Très faible';
  if (effectiveEntropyBits >= 80) label = 'Très fort';
  else if (effectiveEntropyBits >= 60) label = 'Fort';
  else if (effectiveEntropyBits >= 36) label = 'Moyen';
  else if (effectiveEntropyBits >= 28) label = 'Faible';

  const maxEntropyForScore = 100;
  const score = Math.min(100, Math.max(0, Math.round((effectiveEntropyBits / maxEntropyForScore) * 100)));
  return { score, label };
}

export function estimateCrackTimes(effectiveEntropyBits: number): CrackTimes {
  const guessesMean = Math.pow(2, Math.max(effectiveEntropyBits - 1, 0));
  const scenarios: CrackScenario[] = [
    { id: 'offlineFast', guessesPerSecond: 1e10, timeSeconds: 0, formattedTime: '' },
    { id: 'offlineMedium', guessesPerSecond: 1e8, timeSeconds: 0, formattedTime: '' },
    { id: 'onlineLimited', guessesPerSecond: 10, timeSeconds: 0, formattedTime: '' }
  ];

  const mapped = scenarios.reduce((acc, scenario) => {
    const timeSeconds = guessesMean / scenario.guessesPerSecond;
    const formattedTime = formatTime(timeSeconds);
    acc[scenario.id] = { ...scenario, timeSeconds, formattedTime } as CrackScenario;
    return acc;
  }, {} as Record<CrackScenario['id'], CrackScenario>);

  return mapped as CrackTimes;
}

function generateNotes(patterns: PatternFinding[]): string[] {
  const notes = ['Estimation pédagogique basée sur des hypothèses simplifiées.'];
  if (patterns.some((p) => p.type === 'common-word' || p.type === 'leet-common')) {
    notes.push('Les mots de passe courants sont fortement vulnérables même s\'ils contiennent des substitutions.');
  }
  if (patterns.some((p) => p.type === 'date')) {
    notes.push('Évitez les dates ou anniversaires : elles réduisent drastiquement l\'entropie effective.');
  }
  return notes;
}

export function generateSuggestions(result: AnalysisResult): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const { passwordLength, categories, detectedPatterns, diversityRatio, effectiveEntropyBits } = result;

  if (passwordLength < 12) {
    const target = passwordLength >= 8 ? 4 : 12;
    suggestions.push({ message: 'Augmente la longueur (12-16+ caractères).', impactBits: target });
  }
  if (!categories.hasUppercase) {
    suggestions.push({ message: 'Ajoute une majuscule au milieu du mot de passe.', impactBits: 2 });
  }
  if (!categories.hasSymbols) {
    suggestions.push({ message: 'Ajoute 1-2 symboles non en fin de chaîne.', impactBits: 4 });
  }
  if (!categories.hasDigits) {
    suggestions.push({ message: 'Inclure quelques chiffres répartis.', impactBits: 2 });
  }
  if (diversityRatio < 0.5) {
    suggestions.push({ message: 'Augmente la diversité : plus de caractères uniques.', impactBits: 3 });
  }
  if (detectedPatterns.some((p) => p.type === 'sequence')) {
    suggestions.push({ message: 'Évite les suites prévisibles (1234, abcd).', impactBits: 8 });
  }
  if (detectedPatterns.some((p) => p.type === 'repetition')) {
    suggestions.push({ message: 'Évite les répétitions ou motifs répétés.', impactBits: 6 });
  }
  if (detectedPatterns.some((p) => p.type === 'common-word' || p.type === 'leet-common')) {
    suggestions.push({ message: 'Remplace le mot courant par une passphrase originale.', impactBits: 15 });
  }
  if (detectedPatterns.some((p) => p.type === 'date')) {
    suggestions.push({ message: 'Supprime dates ou années personnelles.', impactBits: 10 });
  }
  if (effectiveEntropyBits < 60) {
    suggestions.push({ message: 'Considère une passphrase de plusieurs mots non personnels.', impactBits: 12 });
  }

  const unique = new Map<string, Suggestion>();
  for (const suggestion of suggestions) {
    unique.set(suggestion.message, suggestion);
  }

  return Array.from(unique.values()).slice(0, 8);
}

export function analyzePassword(password: string): AnalysisResult {
  const categories = computeCategories(password);
  const setSize = characterSetSize(categories);
  const uniqueChars = new Set(password.split(''));
  const { patterns, penaltyBits } = detectPatterns(password);

  const rawEntropyBits = password.length * log2(Math.max(setSize, 1));
  let effectiveEntropyBits = Math.max(rawEntropyBits - penaltyBits, 0);
  effectiveEntropyBits = capIfCommonWord(effectiveEntropyBits, patterns);

  const { score, label } = scoreFromEntropy(effectiveEntropyBits);
  const crackTimes = estimateCrackTimes(effectiveEntropyBits);

  const notes = generateNotes(patterns);

  const result: AnalysisResult = {
    passwordLength: password.length,
    categories,
    characterSetSize: setSize,
    uniqueCharCount: uniqueChars.size,
    diversityRatio: uniqueChars.size / Math.max(password.length, 1),
    rawEntropyBits,
    penaltiesBits: penaltyBits,
    effectiveEntropyBits,
    score,
    strengthLabel: label,
    detectedPatterns: patterns,
    crackTimes,
    suggestions: [],
    notes
  };

  result.suggestions = generateSuggestions(result);
  return result;
}

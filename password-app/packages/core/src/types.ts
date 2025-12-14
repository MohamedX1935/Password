export interface CategoryUsage {
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasDigits: boolean;
  hasSymbols: boolean;
}

export type PatternType =
  | 'repetition'
  | 'sequence'
  | 'common-word'
  | 'date'
  | 'leet-common'
  | 'diversity';

export interface PatternFinding {
  type: PatternType;
  message: string;
  penaltyBits: number;
  match?: string;
}

export interface CrackScenario {
  id: 'offlineFast' | 'offlineMedium' | 'onlineLimited';
  guessesPerSecond: number;
  timeSeconds: number;
  formattedTime: string;
}

export interface CrackTimes {
  offlineFast: CrackScenario;
  offlineMedium: CrackScenario;
  onlineLimited: CrackScenario;
}

export interface Suggestion {
  message: string;
  impactBits?: number;
}

export interface AnalysisResult {
  passwordLength: number;
  categories: CategoryUsage;
  characterSetSize: number;
  uniqueCharCount: number;
  diversityRatio: number;
  rawEntropyBits: number;
  penaltiesBits: number;
  effectiveEntropyBits: number;
  score: number;
  strengthLabel: 'Très faible' | 'Faible' | 'Moyen' | 'Fort' | 'Très fort';
  detectedPatterns: PatternFinding[];
  crackTimes: CrackTimes;
  suggestions: Suggestion[];
  notes: string[];
}

export interface GeneratorOptions {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
  excludeAmbiguous?: boolean;
  noRepeats?: boolean;
  requireEachSelectedType?: boolean;
}

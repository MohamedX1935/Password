import { describe, expect, it } from 'vitest';
import {
  analyzePassword,
  detectPatterns,
  generatePassword,
  generateWithAnalysis,
  scoreFromEntropy
} from './index';

describe('password analysis', () => {
  it('detects weak sequence', () => {
    const analysis = analyzePassword('123456');
    expect(analysis.score).toBeLessThan(20);
    expect(analysis.detectedPatterns.some((p) => p.type === 'sequence')).toBe(true);
  });

  it('detects common word with leet', () => {
    const analysis = analyzePassword('P@ssw0rd');
    expect(analysis.detectedPatterns.some((p) => p.type === 'commonWord')).toBe(true);
    expect(analysis.effectiveEntropyBits).toBeLessThan(30);
  });

  it('rates strong passphrase', () => {
    const analysis = analyzePassword('ChansonBleue-Soleil+Prairie2024!');
    expect(analysis.score).toBeGreaterThan(60);
    expect(analysis.strengthLabel === 'Fort' || analysis.strengthLabel === 'Très fort').toBe(true);
  });
});

describe('generator', () => {
  it('respects each type when required', () => {
    const result = generateWithAnalysis({
      length: 16,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
      requireEachSelectedType: true,
      noRepeats: true
    });
    const { analysis } = result;
    expect(analysis.categories.hasLowercase).toBe(true);
    expect(analysis.categories.hasUppercase).toBe(true);
    expect(analysis.categories.hasDigits).toBe(true);
    expect(analysis.categories.hasSymbols).toBe(true);
  });
});

describe('score mapping', () => {
  it('maps entropy to labels', () => {
    expect(scoreFromEntropy(10).label).toBe('Très faible');
    expect(scoreFromEntropy(30).label).toBe('Faible');
    expect(scoreFromEntropy(50).label).toBe('Moyen');
    expect(scoreFromEntropy(70).label).toBe('Fort');
    expect(scoreFromEntropy(90).label).toBe('Très fort');
  });
});

describe('pattern detection helper', () => {
  it('detects repetitions', () => {
    const { patterns } = detectPatterns('aaaa1111');
    expect(patterns.some((p) => p.type === 'repetition')).toBe(true);
  });
});

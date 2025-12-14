import { describe, expect, it } from 'vitest';
import { analyzePassword, generatePassword } from './index';

describe('analyzePassword', () => {
  it('detects weak numeric sequence', () => {
    const result = analyzePassword('123456');
    expect(result.strengthLabel).toBe('Très faible');
    expect(result.detectedPatterns.some((p) => p.type === 'sequence')).toBe(true);
  });

  it('penalizes common word even with leet substitutions', () => {
    const result = analyzePassword('P@ssw0rd');
    expect(result.detectedPatterns.some((p) => p.type === 'leet-common')).toBe(true);
    expect(result.effectiveEntropyBits).toBeLessThan(result.rawEntropyBits);
  });

  it('rewards strong diverse passphrase', () => {
    const result = analyzePassword('Tr0ub4dour-Correct-Horse-Battery-Staple!');
    expect(result.strengthLabel === 'Fort' || result.strengthLabel === 'Très fort').toBe(true);
  });
});

describe('generatePassword', () => {
  it('respects requireEachSelectedType', () => {
    const password = generatePassword({
      length: 12,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
      requireEachSelectedType: true
    });
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/\d/.test(password)).toBe(true);
    expect(/[^a-zA-Z0-9]/.test(password)).toBe(true);
  });
});

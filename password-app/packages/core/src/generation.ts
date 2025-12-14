import { secureRandomIndices, secureShuffle } from './common';
import { GeneratorOptions } from './types';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/\\|`~<>';
const AMBIGUOUS = new Set(['O', '0', 'l', '1', 'I']);

function buildPool(options: GeneratorOptions): string {
  let pool = '';
  if (options.includeLowercase) pool += LOWERCASE;
  if (options.includeUppercase) pool += UPPERCASE;
  if (options.includeDigits) pool += DIGITS;
  if (options.includeSymbols) pool += SYMBOLS;

  if (options.excludeAmbiguous) {
    pool = pool
      .split('')
      .filter((char) => !AMBIGUOUS.has(char))
      .join('');
  }
  return pool;
}

function pickRequiredCharacters(options: GeneratorOptions, pool: string): string[] {
  const required: string[] = [];
  if (options.includeLowercase) required.push(randomChar(LOWERCASE, options.excludeAmbiguous));
  if (options.includeUppercase) required.push(randomChar(UPPERCASE, options.excludeAmbiguous));
  if (options.includeDigits) required.push(randomChar(DIGITS, options.excludeAmbiguous));
  if (options.includeSymbols) required.push(randomChar(SYMBOLS, options.excludeAmbiguous));
  return secureShuffle(required).slice(0, Math.min(required.length, options.length));
}

function randomChar(pool: string, excludeAmbiguous?: boolean): string {
  const filteredPool = excludeAmbiguous
    ? pool
        .split('')
        .filter((char) => !AMBIGUOUS.has(char))
        .join('')
    : pool;
  const [index] = secureRandomIndices(filteredPool.length, 1);
  return filteredPool[index];
}

function validateOptions(options: GeneratorOptions): void {
  if (options.length < 8 || options.length > 64) {
    throw new Error('La longueur doit être comprise entre 8 et 64 caractères.');
  }
  if (!options.includeLowercase && !options.includeUppercase && !options.includeDigits && !options.includeSymbols) {
    throw new Error('Au moins une catégorie de caractères doit être sélectionnée.');
  }
  if (options.requireEachSelectedType) {
    const selectedCount = [
      options.includeLowercase,
      options.includeUppercase,
      options.includeDigits,
      options.includeSymbols
    ].filter(Boolean).length;
    if (selectedCount > options.length) {
      throw new Error('La longueur est insuffisante pour couvrir chaque catégorie demandée.');
    }
  }
}

export function generatePassword(options: GeneratorOptions): string {
  validateOptions(options);
  const pool = buildPool(options);

  const passwordChars: string[] = [];
  if (options.requireEachSelectedType) {
    passwordChars.push(...pickRequiredCharacters(options, pool));
  }

  while (passwordChars.length < options.length) {
    const [index] = secureRandomIndices(pool.length, 1);
    const char = pool[index];
    if (options.noRepeats && passwordChars[passwordChars.length - 1] === char) {
      continue;
    }
    passwordChars.push(char);
  }

  return secureShuffle(passwordChars).join('');
}

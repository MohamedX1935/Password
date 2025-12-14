import { AnalysisResult, GeneratorOptions } from '@password/core';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function serverAnalyze(password: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!response.ok) {
    throw new Error('Analyse serveur indisponible.');
  }
  const data = await response.json();
  return data as AnalysisResult;
}

export async function serverGenerate(options: GeneratorOptions): Promise<{ password: string; analysis: AnalysisResult }> {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  if (!response.ok) {
    throw new Error('Génération serveur indisponible.');
  }
  const data = await response.json();
  return data as { password: string; analysis: AnalysisResult };
}

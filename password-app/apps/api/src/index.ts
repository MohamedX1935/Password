import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { z } from 'zod';
import { analyzeAndEstimate, generateWithAnalysis } from '@password/core';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  })
);
app.use(express.json({ limit: '50kb' }));
app.use(
  morgan('dev', {
    skip: (req) => req.path === '/api/health'
  })
);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/analyze', limiter);
app.use('/api/generate', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, disclaimer: 'Estimation pédagogique' });
});

const analyzeSchema = z.object({
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .max(128, 'Mot de passe trop long')
});

app.post('/api/analyze', (req, res) => {
  const parseResult = analyzeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }
  const { password } = parseResult.data;
  const result = analyzeAndEstimate(password);
  res.json({ ...result, disclaimer: 'Estimation pédagogique. Ne pas tester de mots de passe sensibles.' });
});

const generatorSchema = z.object({
  length: z.number().int().min(8).max(64),
  includeLowercase: z.boolean(),
  includeUppercase: z.boolean(),
  includeDigits: z.boolean(),
  includeSymbols: z.boolean(),
  excludeAmbiguous: z.boolean().optional(),
  noRepeats: z.boolean().optional(),
  requireEachSelectedType: z.boolean().optional()
});

app.post('/api/generate', (req, res) => {
  const parseResult = generatorSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }
  try {
    const generated = generateWithAnalysis(parseResult.data);
    res.json({ ...generated, disclaimer: 'Estimation pédagogique. Mot de passe non stocké.' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée', disclaimer: 'Estimation pédagogique' });
});

app.listen(PORT, () => {
  console.log(`API démarrée sur le port ${PORT}`);
});

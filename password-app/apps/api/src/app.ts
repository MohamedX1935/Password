import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { analyzePassword, generatePassword } from '@password/core';

const analyzeSchema = z.object({
  password: z.string().min(1, 'Mot de passe requis').max(128, 'Mot de passe trop long')
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

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST']
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: '50kb' }));

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

  app.post('/api/analyze', (req, res) => {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { password } = parsed.data;
    const analysis = analyzePassword(password);
    return res.json({ ...analysis, disclaimer: 'Estimation pédagogique. Ne pas tester de mots de passe sensibles.' });
  });

  app.post('/api/generate', (req, res) => {
    const parsed = generatorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      const password = generatePassword(parsed.data);
      const analysis = analyzePassword(password);
      return res.json({
        password,
        analysis,
        disclaimer: 'Estimation pédagogique. Mot de passe non stocké.'
      });
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route non trouvée', disclaimer: 'Estimation pédagogique' });
  });

  return app;
};

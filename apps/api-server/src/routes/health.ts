import { Router } from 'express';

export const healthRoute: Router = Router();

healthRoute.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'figma-to-code-api',
    version: '1.0.0'
  });
});
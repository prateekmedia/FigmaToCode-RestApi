// MUST be first import to set up figma global
import './setup/mockFigma';

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { convertRoute } from './routes/convert';
import { exportImagesRoute } from './routes/exportImages';
import { screenshotRoute } from './routes/screenshot';
import { healthRoute } from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { Logger } from './services/logger';

const app: express.Application = express();
const PORT = process.env.PORT || 3001;

// Basic middleware for local use
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoute);
app.use('/api/convert', convertRoute);
app.use('/api/export-images', exportImagesRoute);
app.use('/api/screenshot', screenshotRoute);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint was not found',
    statusCode: 404,
  });
});

app.listen(PORT, () => {
  Logger.info(`Figma to Code API server running on port ${PORT}`);
});

export default app;
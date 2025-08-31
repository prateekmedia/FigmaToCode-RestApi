import { Router } from 'express';
import { FigmaClient } from '../services/figmaClient';
import { FigmaUrlParser } from '../services/urlParser';
import { Logger } from '../services/logger';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export const screenshotRoute: Router = Router();

interface ScreenshotRequest {
  url: string;
  token?: string;
  scale?: number;
  format?: 'png' | 'svg' | 'jpg';
  saveToFile?: boolean;
  directory?: string;
}

interface ScreenshotResponse {
  imageUrl: string;
  nodeId: string;
  scale: number;
  format: string;
  filePath?: string;
}

const validateScreenshotRequest = (body: any): ScreenshotRequest => {
  if (!body.url || typeof body.url !== 'string') {
    throw new AppError('URL is required and must be a string', 400);
  }

  // Token can come from .env or request body
  const token = body.token || process.env.FIGMA_TOKEN;
  if (!token || typeof token !== 'string') {
    throw new AppError('Figma token is required (provide in request or set FIGMA_TOKEN env var)', 400);
  }

  // Validate URL format
  if (!FigmaUrlParser.isValidFigmaUrl(body.url)) {
    throw new AppError('Invalid Figma URL format', 400);
  }

  // Extract node ID from URL
  const urlParts = FigmaUrlParser.parse(body.url);
  if (!urlParts.nodeId) {
    throw new AppError('Node ID is required in the Figma URL for screenshots', 400);
  }

  const scale = body.scale || 2;
  const format = body.format || 'png';

  // Validate scale
  if (typeof scale !== 'number' || scale < 0.5 || scale > 4) {
    throw new AppError('Scale must be a number between 0.5 and 4', 400);
  }

  // Validate format
  if (!['png', 'svg', 'jpg'].includes(format)) {
    throw new AppError('Format must be one of: png, svg, jpg', 400);
  }

  return {
    url: body.url,
    token,
    scale,
    format: format as 'png' | 'svg' | 'jpg',
    saveToFile: body.saveToFile,
    directory: body.directory,
  };
};

screenshotRoute.post('/', asyncHandler(async (req, res) => {
  Logger.info('Screenshot request received');
  
  // Validate request
  const validatedRequest = validateScreenshotRequest(req.body);
  const { url, token, scale, format, saveToFile, directory } = validatedRequest;

  // Parse Figma URL
  const urlParts = FigmaUrlParser.parse(url);
  Logger.debug('Parsed URL:', urlParts);

  // Create Figma client
  const figmaClient = new FigmaClient(token!);

  // Get screenshot using Figma API
  Logger.info(`Generating ${scale}x screenshot for node: ${urlParts.nodeId}`);
  
  const imageResponse = await figmaClient.getImageUrls(
    urlParts.fileKey,
    [urlParts.nodeId!],
    { format, scale }
  );

  const imageUrl = imageResponse.images[urlParts.nodeId!];
  if (!imageUrl) {
    throw new AppError(`Failed to generate screenshot for node ${urlParts.nodeId}`, 500);
  }

  Logger.info('Screenshot generated successfully');

  const response: ScreenshotResponse = {
    imageUrl,
    nodeId: urlParts.nodeId!,
    scale: scale!,
    format: format!,
  };

  // Save to file if requested
  if (saveToFile) {
    try {
      const outputDir = directory || './screenshots';
      await fs.mkdir(outputDir, { recursive: true });
      
      const filename = `screenshot_${urlParts.nodeId}_${scale}x.${format}`;
      const filePath = path.join(outputDir, filename);
      
      Logger.info(`Downloading and saving screenshot to: ${filePath}`);
      const imageDownload = await axios.get(imageUrl, { responseType: 'stream' });
      
      const writer = require('fs').createWriteStream(filePath);
      imageDownload.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      response.filePath = filePath;
      Logger.info(`Screenshot saved successfully to: ${filePath}`);
      
    } catch (saveError) {
      Logger.error('Screenshot save failed:', saveError);
      throw new AppError(
        `Screenshot generated but file save failed: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`, 
        500
      );
    }
  }

  res.json(response);
}));
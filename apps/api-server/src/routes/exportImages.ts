import { Router } from 'express';
import { FigmaClient } from '../services/figmaClient';
import { FigmaUrlParser } from '../services/urlParser';
import { FigmaAdapter } from '../adapters/figmaAdapter';
import { ImageExporter, ImageExportOptions } from '../services/imageExporter';
import { Logger } from '../services/logger';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const exportImagesRoute: Router = Router();

interface ExportImagesRequest {
  url: string;
  token?: string;
  imageNames?: string[];
  exportOptions?: Partial<ImageExportOptions>;
}

interface ExportImagesResponse {
  images: any;
  mapping: any;
  totalNodes: number;
  exportedNodes: number;
}

const validateExportRequest = (body: any): ExportImagesRequest => {
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

  return {
    url: body.url,
    token,
    imageNames: body.imageNames,
    exportOptions: body.exportOptions,
  };
};

exportImagesRoute.post('/', asyncHandler(async (req, res) => {
  Logger.info('Export images request received');
  
  // Validate request
  const validatedRequest = validateExportRequest(req.body);
  const { url, token, imageNames, exportOptions } = validatedRequest;

  // Parse Figma URL
  const urlParts = FigmaUrlParser.parse(url);
  Logger.debug('Parsed URL:', urlParts);

  // Create Figma client
  const figmaClient = new FigmaClient(token!);

  // Fetch data from Figma
  Logger.info('Fetching Figma data...');
  const { file, nodes } = await figmaClient.getFileAndNodes(
    urlParts.fileKey,
    urlParts.nodeId ? [urlParts.nodeId] : undefined
  );

  Logger.info('Figma data fetched successfully');

  // Adapt data to backend format
  const { restApiNodes } = FigmaAdapter.adaptFigmaData(
    file,
    nodes,
    urlParts.nodeId ? [urlParts.nodeId] : undefined
  );

  if (restApiNodes.length === 0) {
    throw new AppError('No nodes could be found or processed from the provided URL', 400);
  }

  // Export images
  Logger.info('Exporting images...');
  const imageExporter = new ImageExporter(figmaClient);
  const exportResult = await imageExporter.exportImages(
    urlParts.fileKey,
    restApiNodes,
    exportOptions
  );

  Logger.info('Image export completed');

  // Filter results by image names if provided
  let filteredImages = exportResult.images;
  let filteredMapping = exportResult.mapping;
  
  if (imageNames && imageNames.length > 0) {
    filteredMapping = {};
    filteredImages = {};
    
    for (const imageName of imageNames) {
      const nodeId = exportResult.mapping[imageName];
      if (nodeId) {
        filteredMapping[imageName] = nodeId;
        filteredImages[nodeId] = exportResult.images[nodeId];
      }
    }
  }

  const response: ExportImagesResponse = {
    images: filteredImages,
    mapping: filteredMapping,
    totalNodes: Object.keys(exportResult.images).length,
    exportedNodes: Object.keys(filteredImages).length,
  };

  res.json(response);
}));
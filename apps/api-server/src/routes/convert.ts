import { Router } from 'express';
import { ConvertRequest, ConvertResponse, ErrorResponse } from '../types/api';
import { FigmaClient } from '../services/figmaClient';
import { FigmaUrlParser } from '../services/urlParser';
import { FigmaAdapter } from '../adapters/figmaAdapter';
import { CodeGenerator } from '../services/codeGenerator';
import { FileManager } from '../services/fileManager';
import { ImageExporter } from '../services/imageExporter';
import { Logger } from '../services/logger';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { PluginSettings } from 'types';

export const convertRoute: Router = Router();

// Default settings matching the plugin
const defaultPluginSettings: PluginSettings = {
  framework: "HTML" as const,
  showLayerNames: false,
  useOldPluginVersion2025: false,
  responsiveRoot: false,
  flutterGenerationMode: "snippet" as const,
  swiftUIGenerationMode: "snippet" as const,
  composeGenerationMode: "snippet" as const,
  roundTailwindValues: true,
  roundTailwindColors: true,
  useColorVariables: true,
  customTailwindPrefix: "",
  embedImages: false,
  embedVectors: false,
  htmlGenerationMode: "html" as const,
  tailwindGenerationMode: "jsx" as const,
  baseFontSize: 16,
  useTailwind4: false,
};

const validateRequest = (body: any): ConvertRequest => {
  if (!body.url || typeof body.url !== 'string') {
    throw new AppError('URL is required and must be a string', 400);
  }

  if (!body.token || typeof body.token !== 'string') {
    throw new AppError('Figma token is required and must be a string', 400);
  }

  // Validate URL format
  if (!FigmaUrlParser.isValidFigmaUrl(body.url)) {
    throw new AppError('Invalid Figma URL format', 400);
  }

  // Merge settings with defaults
  const settings = {
    ...defaultPluginSettings,
    ...(body.settings || {}),
  };

  // Validate framework
  const validFrameworks = ["HTML", "Tailwind", "Flutter", "SwiftUI", "Compose"];
  if (!validFrameworks.includes(settings.framework)) {
    throw new AppError(`Invalid framework. Must be one of: ${validFrameworks.join(', ')}`, 400);
  }

  // Validate output settings if provided
  const output = body.output;
  if (output) {
    if (output.directory && typeof output.directory !== 'string') {
      throw new AppError('Output directory must be a string', 400);
    }
    if (output.filename && typeof output.filename !== 'string') {
      throw new AppError('Output filename must be a string', 400);
    }
    if (output.saveToFile && typeof output.saveToFile !== 'boolean') {
      throw new AppError('saveToFile must be a boolean', 400);
    }
  }

  return {
    url: body.url,
    token: body.token,
    settings,
    output,
    exportImages: body.exportImages,
    exportImagesOptions: body.exportImagesOptions,
  };
};

convertRoute.post('/', asyncHandler(async (req, res) => {
  Logger.info('Convert request received');
  
  // Validate request
  const validatedRequest = validateRequest(req.body);
  const { url, token, settings, output, exportImages, exportImagesOptions } = validatedRequest;

  // Parse Figma URL
  const urlParts = FigmaUrlParser.parse(url);
  Logger.debug('Parsed URL:', urlParts);

  // Create Figma client
  const figmaClient = new FigmaClient(token);

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

  // Export images if requested
  let exportedImages;
  if (exportImages) {
    Logger.info('Exporting images...');
    const imageExporter = new ImageExporter(figmaClient);
    exportedImages = await imageExporter.exportImages(
      urlParts.fileKey,
      restApiNodes,
      exportImagesOptions
    );
    Logger.info('Image export completed');
  }

  // Generate code using existing backend
  Logger.info('Generating code...');
  const result = await CodeGenerator.generateCode(restApiNodes, settings as PluginSettings, exportedImages);

  Logger.info('Code generation completed');

  // Prepare response
  const response: ConvertResponse = {
    code: result.code,
    htmlPreview: result.htmlPreview,
    colors: result.colors,
    gradients: result.gradients,
    warnings: result.warnings,
    exportedImages,
  };

  // Save to file if requested
  if (output?.saveToFile) {
    try {
      // Validate directory if provided
      if (output.directory && !FileManager.isValidDirectory(output.directory)) {
        throw new AppError('Invalid output directory path', 400);
      }

      Logger.info('Saving code to file...');
      const saveResult = await FileManager.saveFile({
        directory: output.directory,
        filename: output.filename,
        content: result.code,
        framework: (settings as PluginSettings).framework,
      });

      response.filePath = saveResult.filePath;
      Logger.info(`Code saved successfully to: ${saveResult.filePath}`);
      
    } catch (saveError) {
      Logger.error('File save failed:', saveError);
      throw new AppError(
        `Code generated successfully but file save failed: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`, 
        500
      );
    }
  }

  res.json(response);
}));
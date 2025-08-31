import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - sharp will be installed at runtime
import sharp from 'sharp';
import { FigmaClient, FigmaImageResponse } from './figmaClient';
import { Logger } from './logger';
import { AppError } from '../middleware/errorHandler';

export interface ImageExportOptions {
  scales: string[];
  formats: string[];
  directory: string;
  customDirectories: { [scale: string]: string };
  pathPrefix?: string;
  defaultScale?: string;
}

export interface ExportedImageInfo {
  [nodeId: string]: {
    [scale: string]: {
      [format: string]: string;
    };
  };
}

export interface ImageNode {
  id: string;
  name: string;
  type: string;
  priority?: number;
}

export class ImageExporter {
  private figmaClient: FigmaClient;
  private defaultOptions: ImageExportOptions = {
    scales: ['1x', '2x', '3x', '4x'],
    formats: ['png'],
    directory: './images',
    customDirectories: {
      '1x': '1x/',
      '2x': '2x/',
      '3x': '3x/',
      '4x': '4x/',
    },
  };

  constructor(figmaClient: FigmaClient) {
    this.figmaClient = figmaClient;
  }

  /**
   * Finds all image nodes in the design tree
   */
  findImageNodes(nodes: any[]): ImageNode[] {
    const imageNodes: ImageNode[] = [];
    
    const findImages = (node: any) => {
      // Priority 1: Actual image fills (most important)
      if (node.fills && Array.isArray(node.fills)) {
        const hasImageFill = node.fills.some((fill: any) => 
          fill.type === 'IMAGE' && fill.visible !== false
        );
        if (hasImageFill) {
          const priority = (node.type === 'FRAME' || node.type === 'RECTANGLE') ? 1 : 2;
          imageNodes.push({
            id: node.id,
            name: node.name || `image_${node.id}`,
            type: node.type,
            priority,
          });
          Logger.debug(`Found priority ${priority} image node: ${node.name} (${node.type}) with ID: ${node.id}`);
        }
      }

      // Priority 3: Large vector nodes only (skip tiny icons)
      if ((node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') && 
          node.absoluteBoundingBox && 
          node.absoluteBoundingBox.width > 32 && 
          node.absoluteBoundingBox.height > 32) {
        imageNodes.push({
          id: node.id,
          name: node.name || `vector_${node.id}`,
          type: node.type,
          priority: 3,
        });
        Logger.debug(`Found priority 3 vector node: ${node.name} (${node.type}) with ID: ${node.id}`);
      }

      // Recursively check children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(findImages);
      }
    };

    nodes.forEach(findImages);
    
    // Sort by priority (1 = highest, 3 = lowest)
    imageNodes.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    
    Logger.debug(`Total image nodes found: ${imageNodes.length}, prioritized by importance`);
    return imageNodes;
  }

  /**
   * Exports images for all found image nodes
   */
  async exportImages(
    fileKey: string,
    nodes: any[],
    options: Partial<ImageExportOptions> = {}
  ): Promise<ExportedImageInfo> {
    const exportOptions = { ...this.defaultOptions, ...options };
    const imageNodes = this.findImageNodes(nodes);
    
    if (imageNodes.length === 0) {
      Logger.info('No image nodes found for export');
      return {};
    }

    Logger.info(`Found ${imageNodes.length} image nodes to export`);
    
    const exportedImages: ExportedImageInfo = {};
    
    // Create base directory
    await this.ensureDirectory(exportOptions.directory);

    // Process images with concurrent downloads for better performance
    const limitedNodes = imageNodes.slice(0, 5); // Limit to 5 most important nodes
    Logger.info(`Processing ${limitedNodes.length} of ${imageNodes.length} image nodes`);
    
    // Process all nodes concurrently
    const exportPromises = limitedNodes.map(async (imageNode, i) => {
      Logger.debug(`Starting export for node ${i + 1}/${limitedNodes.length}: ${imageNode.name}`);
      
      const sanitizedName = this.sanitizeFilename(imageNode.name);
      const nodeExports: { [scale: string]: { [format: string]: string } } = {};

      // Process scales concurrently
      const scalePromises = exportOptions.scales.map(async (scale) => {
        const scaleNumber = this.parseScale(scale);
        const scaleDir = path.join(exportOptions.directory, exportOptions.customDirectories[scale] || `${scale}/`);
        
        await this.ensureDirectory(scaleDir);
        nodeExports[scale] = {};

        // Process formats concurrently
        const formatPromises = exportOptions.formats.map(async (format) => {
          try {
            const filePath = await this.exportSingleImage(
              fileKey,
              imageNode,
              scaleNumber,
              format as 'png' | 'svg' | 'webp',
              scaleDir,
              sanitizedName,
              scale
            );
            
            const relativePath = path.relative(exportOptions.directory, filePath);
            nodeExports[scale][format] = relativePath;
            
          } catch (error) {
            Logger.warn(`Failed to export ${sanitizedName} at ${scale} in ${format}:`, error);
          }
        });

        await Promise.all(formatPromises);
      });

      await Promise.all(scalePromises);
      return { nodeId: imageNode.id, exports: nodeExports };
    });

    // Wait for all exports to complete
    const results = await Promise.all(exportPromises);
    
    // Merge results into exportedImages
    for (const result of results) {
      exportedImages[result.nodeId] = result.exports;
    }

    if (imageNodes.length > 5) {
      Logger.warn(`Limited image export to first 5 nodes (found ${imageNodes.length} total). Use more specific node selection for full export.`);
    }

    return exportedImages;
  }

  /**
   * Exports a single image with specific scale and format
   */
  private async exportSingleImage(
    fileKey: string,
    imageNode: ImageNode,
    scale: number,
    format: 'png' | 'svg' | 'webp',
    outputDir: string,
    sanitizedName: string,
    scaleString: string
  ): Promise<string> {
    // Determine export format for Figma API
    const figmaFormat = format === 'webp' ? 'png' : format;
    
    // Get image URL from Figma with timeout
    const imageResponse = await Promise.race([
      this.figmaClient.getImageUrls(fileKey, [imageNode.id], { format: figmaFormat, scale }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Image URL fetch timeout')), 10000)
      )
    ]);

    const imageUrl = imageResponse.images[imageNode.id];
    if (!imageUrl) {
      throw new AppError(`No image URL returned for node ${imageNode.id}`, 500);
    }

    // Download image buffer with timeout
    const imageBuffer = await Promise.race([
      this.figmaClient.downloadImage(imageUrl),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Image download timeout')), 15000)
      )
    ]);
    
    // Generate filename
    const scaleSuffix = scaleString !== '1x' ? `_${scaleString}` : '';
    let filename = `${sanitizedName}${scaleSuffix}.${format}`;
    let finalBuffer = imageBuffer;

    // Convert PNG to WebP if requested
    if (format === 'webp' && figmaFormat === 'png') {
      try {
        finalBuffer = await sharp(imageBuffer).webp({ quality: 90 }).toBuffer();
      } catch (error) {
        Logger.warn(`WebP conversion failed for ${sanitizedName}, using PNG:`, error);
        filename = `${sanitizedName}${scaleSuffix}.png`;
        finalBuffer = imageBuffer;
      }
    }

    // Save file
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, finalBuffer);
    
    Logger.debug(`Saved image: ${filePath}`);
    return filePath;
  }

  /**
   * Sanitizes filename for filesystem compatibility
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase() || 'unnamed';
  }

  /**
   * Parses scale string to number (e.g., "2x" -> 2)
   */
  private parseScale(scale: string): number {
    const match = scale.match(/^(\d+(?:\.\d+)?)x?$/);
    return match ? parseFloat(match[1]) : 1;
  }

  /**
   * Ensures directory exists, creates it if needed
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    const resolvedPath = path.resolve(dirPath);
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
      Logger.debug(`Created directory: ${resolvedPath}`);
    }
  }
}
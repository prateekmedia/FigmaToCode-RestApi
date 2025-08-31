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
      // Check if node has image fills - be more inclusive
      if (node.fills && Array.isArray(node.fills)) {
        const hasImageFill = node.fills.some((fill: any) => 
          fill.type === 'IMAGE' && fill.visible !== false
        );
        if (hasImageFill) {
          imageNodes.push({
            id: node.id,
            name: node.name || `image_${node.id}`,
            type: node.type,
          });
          Logger.debug(`Found image node: ${node.name} (${node.type}) with ID: ${node.id}`);
        }
      }

      // Include vector nodes that might have exportable content
      if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
        imageNodes.push({
          id: node.id,
          name: node.name || `vector_${node.id}`,
          type: node.type,
        });
        Logger.debug(`Found vector node: ${node.name} (${node.type}) with ID: ${node.id}`);
      }

      // Also check for any node that might generate images in Flutter
      if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
        if (node.fills && Array.isArray(node.fills)) {
          const hasImageFill = node.fills.some((fill: any) => fill.type === 'IMAGE');
          if (hasImageFill) {
            imageNodes.push({
              id: node.id,
              name: node.name || `frame_image_${node.id}`,
              type: node.type,
            });
            Logger.debug(`Found frame with image: ${node.name} (${node.type}) with ID: ${node.id}`);
          }
        }
      }

      // Recursively check children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(findImages);
      }
    };

    nodes.forEach(findImages);
    Logger.debug(`Total image nodes found: ${imageNodes.length}`);
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

    // Process images with better error handling and limits
    for (let i = 0; i < Math.min(imageNodes.length, 10); i++) {
      const imageNode = imageNodes[i];
      Logger.debug(`Exporting images for node ${i + 1}/${imageNodes.length}: ${imageNode.name}`);
      
      const sanitizedName = this.sanitizeFilename(imageNode.name);
      exportedImages[imageNode.id] = {};

      for (const scale of exportOptions.scales) {
        const scaleNumber = this.parseScale(scale);
        const scaleDir = path.join(exportOptions.directory, exportOptions.customDirectories[scale] || `${scale}/`);
        
        await this.ensureDirectory(scaleDir);
        exportedImages[imageNode.id][scale] = {};

        for (const format of exportOptions.formats) {
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
            
            // Store relative path from images directory
            const relativePath = path.relative(exportOptions.directory, filePath);
            exportedImages[imageNode.id][scale][format] = relativePath;
            
          } catch (error) {
            Logger.warn(`Failed to export ${sanitizedName} at ${scale} in ${format}:`, error);
            // Continue with other exports even if one fails
          }
        }
      }
    }

    if (imageNodes.length > 10) {
      Logger.warn(`Limited image export to first 10 nodes (found ${imageNodes.length} total). Use more specific node selection for full export.`);
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
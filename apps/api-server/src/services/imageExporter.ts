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
}

export interface ExportedImageInfo {
  [nodeName: string]: {
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
      // Check if node has image fills
      if (node.fills && Array.isArray(node.fills)) {
        const hasImageFill = node.fills.some((fill: any) => 
          fill.type === 'IMAGE' && fill.imageRef
        );
        if (hasImageFill) {
          imageNodes.push({
            id: node.id,
            name: node.name || `image_${node.id}`,
            type: node.type,
          });
        }
      }

      // Check for vector/icon nodes that should be exported as SVG
      if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
        imageNodes.push({
          id: node.id,
          name: node.name || `vector_${node.id}`,
          type: node.type,
        });
      }

      // Recursively check children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(findImages);
      }
    };

    nodes.forEach(findImages);
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

    for (const imageNode of imageNodes) {
      Logger.debug(`Exporting images for node: ${imageNode.name}`);
      
      const sanitizedName = this.sanitizeFilename(imageNode.name);
      exportedImages[sanitizedName] = {};

      for (const scale of exportOptions.scales) {
        const scaleNumber = this.parseScale(scale);
        const scaleDir = path.join(exportOptions.directory, exportOptions.customDirectories[scale] || `${scale}/`);
        
        await this.ensureDirectory(scaleDir);
        exportedImages[sanitizedName][scale] = {};

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
            exportedImages[sanitizedName][scale][format] = relativePath;
            
          } catch (error) {
            Logger.warn(`Failed to export ${sanitizedName} at ${scale} in ${format}:`, error);
          }
        }
      }
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
    
    // Get image URL from Figma
    const imageResponse = await this.figmaClient.getImageUrls(
      fileKey,
      [imageNode.id],
      { format: figmaFormat, scale }
    );

    const imageUrl = imageResponse.images[imageNode.id];
    if (!imageUrl) {
      throw new AppError(`No image URL returned for node ${imageNode.id}`, 500);
    }

    // Download image buffer
    const imageBuffer = await this.figmaClient.downloadImage(imageUrl);
    
    // Generate filename
    const scaleSuffix = scaleString !== '1x' ? `_${scaleString}` : '';
    let filename = `${sanitizedName}${scaleSuffix}.${format}`;
    let finalBuffer = imageBuffer;

    // Convert PNG to WebP if requested
    if (format === 'webp' && figmaFormat === 'png') {
      finalBuffer = await sharp(imageBuffer).webp({ quality: 90 }).toBuffer();
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
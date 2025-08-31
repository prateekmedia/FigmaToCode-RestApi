import { PluginSettings } from "../../../../packages/types/src";
import { nodesToJSON } from "../../../../packages/backend/src/altNodes/jsonNodeConversion";
import { convertToCode } from "../../../../packages/backend/src/common/retrieveUI/convertToCode";
import { generateHTMLPreview } from "../../../../packages/backend/src/html/htmlMain";
import { 
  retrieveGenericSolidUIColors, 
  retrieveGenericLinearGradients 
} from "../../../../packages/backend/src/common/retrieveUI/retrieveColors";
import { 
  warnings, 
  clearWarnings 
} from "../../../../packages/backend/src/common/commonConversionWarnings";
import { resetPerformanceCounters } from "../../../../packages/backend/src/altNodes/jsonNodeConversion";
import { Logger } from "./logger";
import { AppError } from "../middleware/errorHandler";
import { ExportedImageInfo } from "./imageExporter";

export interface CodeGenerationResult {
  code: string;
  htmlPreview: string;
  colors: any[];
  gradients: any[];
  warnings: string[];
}

export class CodeGenerator {
  /**
   * Generates code from REST API node data
   * This replicates the logic from packages/backend/src/code.ts but for API usage
   */
  static async generateCode(
    restApiNodes: any[], 
    settings: PluginSettings,
    exportedImages?: ExportedImageInfo,
    imageOptions?: { pathPrefix?: string; defaultScale?: string }
  ): Promise<CodeGenerationResult> {
    // Reset performance counters and warnings like the plugin does
    resetPerformanceCounters();
    clearWarnings();

    Logger.info(`Starting code generation for ${restApiNodes.length} nodes`);

    if (restApiNodes.length === 0) {
      throw new AppError('No nodes provided for conversion', 400);
    }

    // The key insight: instead of using nodesToJSON which expects plugin nodes,
    // we directly use the REST API node data which is already in JSON format
    // We just need to process it to match the internal format
    Logger.debug('Processing REST API nodes...');
    const convertedSelection = await this.processRestApiNodes(restApiNodes, settings, exportedImages, imageOptions);
    
    if (convertedSelection.length === 0) {
      throw new AppError('No nodes could be converted', 400);
    }

    Logger.debug(`Processed ${convertedSelection.length} nodes`);

    // Generate code using existing backend logic
    Logger.debug(`Generating ${settings.framework} code...`);
    const code = await convertToCode(convertedSelection, settings);

    // Generate HTML preview
    Logger.debug('Generating HTML preview...');
    const htmlPreviewResult = await generateHTMLPreview(convertedSelection, settings);
    const htmlPreview = typeof htmlPreviewResult === 'string' ? htmlPreviewResult : htmlPreviewResult.content;

    // Skip color extraction in API mode for now (requires plugin environment)
    Logger.debug('Skipping color extraction in API mode...');
    const colors: any[] = [];
    const gradients: any[] = [];

    // Get any warnings that were generated
    const generatedWarnings: string[] = Array.from(warnings);

    Logger.info('Code generation completed successfully');

    return {
      code,
      htmlPreview,
      colors,
      gradients,
      warnings: generatedWarnings,
    };
  }

  /**
   * Processes REST API nodes to match the format the backend expects
   * This bypasses nodesToJSON since we already have JSON data from the REST API
   */
  private static async processRestApiNodes(restApiNodes: any[], settings: PluginSettings, exportedImages?: ExportedImageInfo, imageOptions?: { pathPrefix?: string; defaultScale?: string }): Promise<any[]> {
    // First pass: normalize coordinates to 0-based system
    const normalizedNodes = this.normalizeCoordinates(restApiNodes);
    
    const processedNodes = [];
    for (const node of normalizedNodes) {
      // Process the node to match what nodesToJSON would output
      const processedNode = await this.processRestApiNode(node, settings, exportedImages, imageOptions);
      if (processedNode) {
        processedNodes.push(processedNode);
      }
    }

    return processedNodes;
  }

  /**
   * Normalizes Figma's absolute coordinate system to a 0-based Flutter coordinate system
   */
  private static normalizeCoordinates(nodes: any[]): any[] {
    if (nodes.length === 0) return nodes;
    
    // Find the bounding box of all nodes to establish the coordinate system
    let minX = Infinity;
    let minY = Infinity;
    
    const findBounds = (node: any) => {
      if (node.absoluteBoundingBox) {
        minX = Math.min(minX, node.absoluteBoundingBox.x);
        minY = Math.min(minY, node.absoluteBoundingBox.y);
      }
      if (node.children) {
        node.children.forEach(findBounds);
      }
    };
    
    nodes.forEach(findBounds);
    
    // If we couldn't find bounds, don't normalize
    if (minX === Infinity || minY === Infinity) {
      return nodes;
    }
    
    // Recursively normalize all coordinates
    const normalizeNode = (node: any): any => {
      const normalizedNode = { ...node };
      
      if (normalizedNode.absoluteBoundingBox) {
        normalizedNode.absoluteBoundingBox = {
          ...normalizedNode.absoluteBoundingBox,
          x: normalizedNode.absoluteBoundingBox.x - minX,
          y: normalizedNode.absoluteBoundingBox.y - minY,
        };
      }
      
      // Also normalize x,y if they exist
      if (normalizedNode.x !== undefined) {
        normalizedNode.x = normalizedNode.x - minX;
      }
      if (normalizedNode.y !== undefined) {
        normalizedNode.y = normalizedNode.y - minY;
      }
      
      if (normalizedNode.children) {
        normalizedNode.children = normalizedNode.children.map(normalizeNode);
      }
      
      return normalizedNode;
    };
    
    return nodes.map(normalizeNode);
  }

  /**
   * Processes a single REST API node to match backend expectations
   */
  private static async processRestApiNode(node: any, settings: PluginSettings, exportedImages?: ExportedImageInfo, imageOptions?: { pathPrefix?: string; defaultScale?: string }): Promise<any> {
    // Start with the node as-is since REST API already provides JSON
    const processedNode = {
      ...node,
      // Ensure required properties exist with defaults
      id: node.id,
      name: node.name || 'Untitled',
      type: node.type,
      visible: node.visible !== false,
      locked: node.locked || false,
    };

    // Handle GROUP to FRAME conversion like nodesToJSON does
    if (processedNode.type === 'GROUP') {
      processedNode.type = 'FRAME';
      
      // Handle rotation if present (convert to degrees and reset)
      if (processedNode.rotation) {
        processedNode.rotation = 0;
      }
    }

    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      processedNode.children = [];
      for (const child of node.children) {
        const processedChild = await this.processRestApiNode(child, settings, exportedImages, imageOptions);
        if (processedChild) {
          processedNode.children.push(processedChild);
        }
      }
    }

    // Replace image placeholders with actual paths if available
    if (exportedImages) {
      Logger.debug(`Updating image paths for node: ${processedNode.name}`);
      this.updateImagePaths(processedNode, exportedImages, imageOptions);
    }

    // Map REST API layout properties to expected format for Flutter generation
    processedNode.layoutMode = node.layoutMode || 'NONE';
    processedNode.primaryAxisSizingMode = node.primaryAxisSizingMode;
    processedNode.counterAxisSizingMode = node.counterAxisSizingMode;
    processedNode.primaryAxisAlignItems = node.primaryAxisAlignItems;
    processedNode.counterAxisAlignItems = node.counterAxisAlignItems;
    processedNode.itemSpacing = node.itemSpacing;
    processedNode.layoutPositioning = node.layoutPositioning || 'AUTO';

    // Preserve absolute positioning data
    if (node.absoluteBoundingBox) {
      processedNode.x = node.absoluteBoundingBox.x;
      processedNode.y = node.absoluteBoundingBox.y;
      processedNode.width = node.absoluteBoundingBox.width;
      processedNode.height = node.absoluteBoundingBox.height;
    }

    // Mark if this is an absolute positioned child
    if (node.constraints) {
      processedNode.constraints = node.constraints;
    }
    
    return processedNode;
  }

  /**
   * Extracts colors from processed nodes
   */
  private static async extractColors(nodes: any[]): Promise<any[]> {
    try {
      return retrieveGenericSolidUIColors(nodes as any);
    } catch (error) {
      Logger.warn('Color extraction failed:', error);
      return [];
    }
  }

  /**
   * Extracts gradients from processed nodes
   */
  private static async extractGradients(nodes: any[]): Promise<any[]> {
    try {
      return retrieveGenericLinearGradients(nodes as any);
    } catch (error) {
      Logger.warn('Gradient extraction failed:', error);
      return [];
    }
  }

  /**
   * Updates image paths in processed nodes to use actual downloaded images
   */
  private static updateImagePaths(node: any, exportedImages: ExportedImageInfo, imageOptions?: { pathPrefix?: string; defaultScale?: string }): void {
    Logger.debug(`Checking image paths for node "${node.name}" (ID: ${node.id})`, {
      availableImages: Object.keys(exportedImages),
      nodeType: node.type,
      hasFills: !!(node.fills && node.fills.length > 0)
    });
    
    // Check if this node has exported images using node ID
    if (exportedImages[node.id]) {
      const imageData = exportedImages[node.id];
      Logger.debug(`Found image data for ${node.id}:`, imageData);
      
      // Use configured scale or default to first available scale
      const defaultScale = imageOptions?.defaultScale || Object.keys(imageData)[0] || '1x';
      const scaleData = imageData[defaultScale];
      
      if (scaleData && Object.keys(scaleData).length > 0) {
        const format = Object.keys(scaleData)[0]; // Use first available format
        let imagePath = scaleData[format];
        
        // Add path prefix if configured
        if (imageOptions?.pathPrefix) {
          imagePath = imageOptions.pathPrefix + imagePath;
        }
        
        Logger.debug(`Setting image path: ${imagePath} for node: ${node.name} (scale: ${defaultScale}, format: ${format})`);
        
        // Update fills if they contain image references
        if (node.fills && Array.isArray(node.fills)) {
          const originalFills = node.fills.length;
          node.fills = node.fills.map((fill: any) => {
            if (fill.type === 'IMAGE') {
              Logger.debug(`Updated IMAGE fill for ${node.name} with path: ${imagePath}`);
              return {
                ...fill,
                // Add custom property for image path that our Flutter generator can use
                localImagePath: imagePath,
              };
            }
            return fill;
          });
          Logger.debug(`Processed ${originalFills} fills for ${node.name}`);
        }
        
        // For vector nodes, add the image path directly
        if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
          node.localImagePath = imagePath;
          Logger.debug(`Set localImagePath for vector ${node.name}: ${imagePath}`);
        }
      }
    }

    // Recursively update children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => this.updateImagePaths(child, exportedImages, imageOptions));
    }
  }

  /**
   * Sanitizes node name to match the filename sanitization in ImageExporter
   */
  private static sanitizeNodeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase() || 'unnamed';
  }
}
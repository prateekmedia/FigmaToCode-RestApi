import { FigmaUrlParts } from '../types/api';

export class FigmaUrlParser {
  static parse(url: string): FigmaUrlParts {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a valid Figma URL
      if (!urlObj.hostname.includes('figma.com')) {
        throw new Error('URL is not a valid Figma URL');
      }

      // Extract file key from path
      // Patterns: 
      // /design/:key/:name
      // /file/:key/:name
      // /proto/:key/:name
      const pathMatch = urlObj.pathname.match(/\/(design|file|proto)\/([a-zA-Z0-9]+)/);
      
      if (!pathMatch || !pathMatch[2]) {
        throw new Error('Could not extract file key from URL');
      }

      const fileKey = pathMatch[2];
      
      // Extract node ID from query parameters
      const nodeIdParam = urlObj.searchParams.get('node-id');
      let nodeId: string | undefined;
      
      if (nodeIdParam) {
        // Convert from URL format (40839-53710) to API format (40839:53710)
        nodeId = nodeIdParam.replace(/-/g, ':');
      }

      return {
        fileKey,
        nodeId,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid Figma URL: ${error.message}`);
      }
      throw new Error('Invalid Figma URL format');
    }
  }

  static isValidFigmaUrl(url: string): boolean {
    try {
      this.parse(url);
      return true;
    } catch {
      return false;
    }
  }
}
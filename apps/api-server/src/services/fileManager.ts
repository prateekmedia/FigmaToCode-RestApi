import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';

export interface SaveFileOptions {
  directory?: string;
  filename?: string;
  content: string;
  framework: string;
}

export interface SaveFileResult {
  filePath: string;
  success: boolean;
}

export class FileManager {
  /**
   * Saves generated code to a file in the specified directory
   */
  static async saveFile(options: SaveFileOptions): Promise<SaveFileResult> {
    const { directory = process.cwd(), filename, content, framework } = options;

    try {
      // Resolve and validate directory
      const resolvedDirectory = path.resolve(directory);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(resolvedDirectory)) {
        fs.mkdirSync(resolvedDirectory, { recursive: true });
        Logger.info(`Created directory: ${resolvedDirectory}`);
      }

      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename(framework);

      // Ensure proper file extension
      const finalFilenameWithExtension = this.ensureFileExtension(finalFilename, framework);

      // Construct full file path
      const filePath = path.join(resolvedDirectory, finalFilenameWithExtension);

      // Validate file path is safe (no directory traversal)
      if (!filePath.startsWith(resolvedDirectory)) {
        throw new Error('Invalid file path: directory traversal detected');
      }

      // Write file
      fs.writeFileSync(filePath, content, 'utf8');
      
      Logger.info(`Code saved to: ${filePath}`);

      return {
        filePath,
        success: true,
      };

    } catch (error) {
      Logger.error('File save failed:', error);
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a default filename based on framework and timestamp
   */
  private static generateFilename(framework: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `figma-${framework.toLowerCase()}-${timestamp}`;
  }

  /**
   * Ensures the filename has the appropriate extension for the framework
   */
  private static ensureFileExtension(filename: string, framework: string): string {
    const extensions = {
      'HTML': '.html',
      'Tailwind': '.jsx',
      'Flutter': '.dart',
      'SwiftUI': '.swift',
      'Compose': '.kt',
    };

    const expectedExtension = extensions[framework as keyof typeof extensions] || '.txt';
    
    // If filename already has an extension, use it
    if (path.extname(filename)) {
      return filename;
    }

    // Add the appropriate extension
    return filename + expectedExtension;
  }

  /**
   * Validates that a directory path is safe to write to
   */
  static isValidDirectory(directory: string): boolean {
    try {
      const resolved = path.resolve(directory);
      
      // Check for common unsafe patterns
      if (resolved.includes('..') || resolved.includes('~')) {
        return false;
      }

      // Must be an absolute path after resolution
      if (!path.isAbsolute(resolved)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets file extension recommendations for different frameworks
   */
  static getRecommendedExtension(framework: string): string {
    const extensions = {
      'HTML': '.html',
      'Tailwind': '.jsx',
      'Flutter': '.dart',
      'SwiftUI': '.swift',
      'Compose': '.kt',
    };

    return extensions[framework as keyof typeof extensions] || '.txt';
  }
}
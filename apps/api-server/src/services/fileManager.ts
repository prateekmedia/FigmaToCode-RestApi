import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';
import { AppError } from '../middleware/errorHandler';

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
        throw new AppError('Invalid file path: directory traversal detected', 400);
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
      throw new AppError(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
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
      
      // Check for directory traversal attempts in the original path
      // (not in the resolved path since that might contain '..' as part of actual directory names)
      if (directory.includes('../') || directory.includes('..\\')) {
        return false;
      }

      // Check for home directory expansion attempts
      if (directory.startsWith('~')) {
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
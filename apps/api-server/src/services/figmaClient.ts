import axios, { AxiosInstance } from 'axios';
import { AppError } from '../middleware/errorHandler';

export interface FigmaFileResponse {
  document: any;
  components: { [key: string]: any };
  componentSets: { [key: string]: any };
  schemaVersion: number;
  styles: { [key: string]: any };
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  editorType: string;
  linkAccess: string;
}

export interface FigmaNodesResponse {
  nodes: { [key: string]: any };
}

export class FigmaClient {
  private client: AxiosInstance;
  
  constructor(token: string) {
    this.client = axios.create({
      baseURL: 'https://api.figma.com/v1',
      headers: {
        'X-Figma-Token': token,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || error.message;
          
          if (status === 401) {
            throw new AppError('Invalid Figma token or insufficient permissions', 401);
          } else if (status === 403) {
            throw new AppError('Access denied. Check file permissions or token scope', 403);
          } else if (status === 404) {
            throw new AppError('Figma file or node not found', 404);
          } else if (status === 429) {
            throw new AppError('Rate limit exceeded. Please try again later', 429);
          }
          
          throw new AppError(`Figma API error (${status}): ${message}`, status);
        }
        
        throw new AppError(`Network error: ${error.message}`, 500);
      }
    );
  }

  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    try {
      const response = await this.client.get(`/files/${fileKey}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getNodes(fileKey: string, nodeIds: string[]): Promise<FigmaNodesResponse> {
    try {
      const idsParam = nodeIds.join(',');
      const response = await this.client.get(`/files/${fileKey}/nodes?ids=${idsParam}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getFileAndNodes(fileKey: string, nodeIds?: string[]): Promise<{
    file?: FigmaFileResponse;
    nodes?: FigmaNodesResponse;
  }> {
    try {
      // If specific nodes are requested, fetch them directly (faster)
      if (nodeIds && nodeIds.length > 0) {
        const nodes = await this.getNodes(fileKey, nodeIds);
        return { nodes };
      }

      // Otherwise fetch the full file data
      const file = await this.getFile(fileKey);
      return { file };
    } catch (error) {
      throw error;
    }
  }
}
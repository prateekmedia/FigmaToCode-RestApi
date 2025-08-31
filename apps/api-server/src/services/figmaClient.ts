import axios, { AxiosInstance } from 'axios';

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
            throw new Error('Invalid Figma token or insufficient permissions');
          } else if (status === 403) {
            throw new Error('Access denied. Check file permissions or token scope');
          } else if (status === 404) {
            throw new Error('Figma file or node not found');
          } else if (status === 429) {
            throw new Error('Rate limit exceeded. Please try again later');
          }
          
          throw new Error(`Figma API error (${status}): ${message}`);
        }
        
        throw new Error(`Network error: ${error.message}`);
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
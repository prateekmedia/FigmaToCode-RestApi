import { FigmaFileResponse, FigmaNodesResponse } from '../services/figmaClient';

export class FigmaAdapter {
  /**
   * Creates a mock Figma plugin environment for the backend to use
   * This bridges the gap between REST API and plugin API
   */
  static createMockFigmaEnvironment(fileData: FigmaFileResponse, nodesData?: FigmaNodesResponse) {
    // Mock the figma global that the backend expects
    (globalThis as any).figma = {
      currentPage: {
        selection: [], // Will be populated with processed nodes
      },
      ui: {
        postMessage: () => {}, // No-op for API mode
      },
    };
  }

  /**
   * Converts REST API node data to plugin-compatible format
   * The backend expects nodes to have exportAsync() method results
   */
  static adaptNodesToPluginFormat(fileData: FigmaFileResponse, nodeIds?: string[]): any[] {
    const document = fileData.document;
    const targetNodes: any[] = [];

    if (nodeIds && nodeIds.length > 0) {
      // Find specific nodes by ID
      for (const nodeId of nodeIds) {
        const node = this.findNodeById(document, nodeId);
        if (node) {
          targetNodes.push(this.transformNodeToExportFormat(node));
        }
      }
    } else {
      // If no specific nodes, use all top-level children
      if (document.children) {
        for (const child of document.children) {
          targetNodes.push(this.transformNodeToExportFormat(child));
        }
      }
    }

    return targetNodes;
  }

  /**
   * Recursively finds a node by ID in the document tree
   */
  private static findNodeById(node: any, targetId: string): any {
    if (node.id === targetId) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(child, targetId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Transforms a REST API node to match the format that node.exportAsync({ format: "JSON_REST_V1" }) returns
   * This is crucial because the backend expects this specific format
   */
  private static transformNodeToExportFormat(node: any): any {
    // The backend expects a format similar to what exportAsync returns
    // which has a { document: ... } wrapper
    const transformedNode = {
      ...node,
      // Ensure all required properties exist
      visible: node.visible !== false, // REST API only includes visible when false
      locked: node.locked || false,
    };

    // Handle children recursively
    if (node.children) {
      transformedNode.children = node.children.map((child: any) =>
        this.transformNodeToExportFormat(child)
      );
    }

    // Convert GROUP to FRAME as the plugin does
    if (transformedNode.type === 'GROUP') {
      transformedNode.type = 'FRAME';
    }

    return transformedNode;
  }

  /**
   * Creates mock scene nodes that have the interface the backend expects
   */
  static createMockSceneNodes(adaptedNodes: any[]): any[] {
    return adaptedNodes.map(node => ({
      ...node,
      // Add methods that the backend might call
      exportAsync: async (options: any) => {
        // Return the node data in the format the backend expects
        return { document: node };
      },
      // Mock other methods that might be called
      type: node.type,
      id: node.id,
      name: node.name,
    }));
  }

  /**
   * Main adapter function that processes Figma REST API response
   * and returns data in the format the backend expects
   */
  static adaptFigmaData(fileData?: FigmaFileResponse, nodesData?: FigmaNodesResponse, nodeIds?: string[]): {
    restApiNodes: any[];
    fileData?: FigmaFileResponse;
  } {
    // Set up mock environment for any code that might need it
    this.createMockFigmaEnvironment(fileData);

    let restApiNodes: any[] = [];

    if (nodesData) {
      // Extract nodes from nodes API response
      restApiNodes = this.extractNodesFromNodesResponse(nodesData);
    } else if (fileData) {
      // Extract nodes from file document
      restApiNodes = this.extractNodesFromDocument(fileData, nodeIds);
    }

    return {
      restApiNodes,
      fileData,
    };
  }

  /**
   * Extracts nodes from the nodes API response
   */
  private static extractNodesFromNodesResponse(nodesData: FigmaNodesResponse): any[] {
    const nodes = [];
    
    for (const nodeId in nodesData.nodes) {
      const nodeWrapper = nodesData.nodes[nodeId];
      if (nodeWrapper && nodeWrapper.document) {
        nodes.push(nodeWrapper.document);
      }
    }

    return nodes;
  }

  /**
   * Extracts target nodes from the Figma file document
   */
  private static extractNodesFromDocument(fileData: FigmaFileResponse, nodeIds?: string[]): any[] {
    const document = fileData.document;
    const targetNodes: any[] = [];

    if (nodeIds && nodeIds.length > 0) {
      // Find specific nodes by ID
      for (const nodeId of nodeIds) {
        const node = this.findNodeById(document, nodeId);
        if (node) {
          targetNodes.push(node);
        }
      }
    } else {
      // If no specific nodes, use all top-level children of pages
      if (document.children) {
        for (const page of document.children) {
          if (page.type === 'CANVAS' && page.children) {
            targetNodes.push(...page.children);
          }
        }
      }
    }

    return targetNodes;
  }
}
import { PluginSettings } from "types";

export interface ConvertRequest {
  url: string;
  token: string;
  settings?: Partial<PluginSettings>;
  output?: {
    directory?: string;
    filename?: string;
    saveToFile?: boolean;
  };
  exportImages?: boolean;
  exportImagesOptions?: {
    scales?: string[];
    formats?: string[];
    directory?: string;
    customDirectories?: { [scale: string]: string };
  };
}

export interface ConvertResponse {
  code: string;
  htmlPreview: string;
  colors: ColorInfo[];
  gradients: GradientInfo[];
  warnings: string[];
  filePath?: string;
  exportedImages?: {
    [nodeName: string]: {
      [scale: string]: {
        [format: string]: string;
      };
    };
  };
}

export interface ColorInfo {
  name: string;
  hex: string;
  rgb: string;
}

export interface GradientInfo {
  name: string;
  css: string;
}

export interface FigmaUrlParts {
  fileKey: string;
  nodeId?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
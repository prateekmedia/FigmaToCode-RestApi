# Figma to Code API Server

A standalone API server that converts Figma designs to code in multiple frameworks without requiring the Figma plugin environment. This enables CLI usage and integration in environments where the Figma plugin cannot run.

## Features

- **Multiple Frameworks**: HTML, Tailwind, Flutter, SwiftUI, Jetpack Compose
- **Direct Figma URL Support**: Input any Figma design URL with node-id
- **Personal Access Token**: Use your own Figma PAT for authentication
- **Same Output**: Identical code generation to the original plugin
- **REST API**: Clean JSON API for integration with other tools

## API Endpoints

### POST /api/convert

Converts a Figma design to code with optional file saving.

**Request:**
```json
{
  "url": "https://www.figma.com/design/FILE_KEY/NAME?node-id=NODE_ID",
  "token": "your_figma_personal_access_token",
  "settings": {
    "framework": "HTML",
    "showLayerNames": false,
    "responsiveRoot": false
  },
  "output": {
    "saveToFile": true,
    "directory": "./output",
    "filename": "my-component"
  }
}
```

**Response:**
```json
{
  "code": "generated code string",
  "htmlPreview": "html preview string", 
  "colors": [...],
  "gradients": [...],
  "warnings": [...],
  "filePath": "/path/to/saved/file.html"
}
```

**Output Parameters:**
- `saveToFile`: Boolean to enable file saving
- `directory`: Target directory (defaults to current working directory)
- `filename`: Custom filename (auto-generated if not provided)
- File extensions are automatically added based on framework

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-08-29T19:32:25.819Z",
  "service": "figma-to-code-api",
  "version": "1.0.0"
}
```

## Supported Settings

All settings from the original plugin are supported:

- **framework**: "HTML" | "Tailwind" | "Flutter" | "SwiftUI" | "Compose"
- **showLayerNames**: boolean
- **responsiveRoot**: boolean
- **flutterGenerationMode**: "fullApp" | "stateless" | "snippet"
- **swiftUIGenerationMode**: "preview" | "struct" | "snippet"
- **composeGenerationMode**: "snippet" | "composable" | "screen"
- **roundTailwindValues**: boolean
- **roundTailwindColors**: boolean
- **useColorVariables**: boolean
- **customTailwindPrefix**: string
- **embedImages**: boolean
- **embedVectors**: boolean
- **htmlGenerationMode**: "html" | "jsx" | "styled-components" | "svelte"
- **tailwindGenerationMode**: "html" | "jsx"
- **baseFontSize**: number
- **useTailwind4**: boolean

## Example Usage

### Basic HTML Generation
```bash
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.figma.com/design/SYtMyLBs5SAOkTbfMMzhqt/Ente-Visual-Design?node-id=40839-53710",
    "token": "your_figma_pat_here"
  }'
```

### Tailwind with File Saving
```bash
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.figma.com/design/SYtMyLBs5SAOkTbfMMzhqt/Ente-Visual-Design?node-id=40839-53710",
    "token": "your_figma_pat_here",
    "settings": {
      "framework": "Tailwind",
      "tailwindGenerationMode": "jsx",
      "useColorVariables": true,
      "responsiveRoot": true
    },
    "output": {
      "saveToFile": true,
      "directory": "./src/components",
      "filename": "GeneratedComponent"
    }
  }'
```

### Flutter with Auto-generated Filename
```bash
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.figma.com/design/SYtMyLBs5SAOkTbfMMzhqt/Ente-Visual-Design?node-id=40839-53710",
    "token": "your_figma_pat_here",
    "settings": {"framework": "Flutter"},
    "output": {
      "saveToFile": true,
      "directory": "./lib/widgets"
    }
  }'
```

## Getting a Figma Personal Access Token

1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll to "Personal access tokens"
3. Click "Create new token"
4. Give it a name and appropriate permissions
5. Copy the token (you won't see it again)

## Development

```bash
# Install dependencies (from workspace root)
pnpm install

# Development mode with hot reload
cd apps/api-server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture

The API server bridges the gap between the Figma REST API and the existing plugin codebase:

1. **URL Parser**: Extracts file key and node IDs from Figma URLs
2. **Figma Client**: Fetches design data using REST API and PAT
3. **Adapter Layer**: Transforms REST API data to plugin-compatible format
4. **Code Generator**: Uses existing backend logic to generate framework code
5. **Express Server**: Exposes everything as a clean REST API

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Request Failed",
  "message": "Invalid Figma token or insufficient permissions",
  "statusCode": 401
}
```

Common status codes:
- **400**: Bad request (invalid URL, missing parameters)
- **401**: Unauthorized (invalid token)
- **404**: Not found (file or node doesn't exist)
- **429**: Rate limit exceeded
- **500**: Internal server error
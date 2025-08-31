# Figma to Code REST API

<p align="center">
<a href="https://github.com/prateekmedia/FigmaToCode-RestApi/actions/"><img src="https://github.com/prateekmedia/FigmaToCode-RestApi/workflows/CI/badge.svg"/></a>
<a href="https://codecov.io/gh/prateekmedia/FigmaToCode-RestApi"><img src="https://codecov.io/gh/prateekmedia/FigmaToCode-RestApi/branch/master/graph/badge.svg" /></a>
</p>

A REST API server that converts Figma designs into production-ready code with automatic image export and screenshot capabilities. Generate responsive layouts in `Flutter`, `HTML`, `React (JSX)`, `Tailwind`, `SwiftUI`, and `Compose` directly from Figma URLs.

![Gif showing the conversion](assets/lossy_gif.gif)

## Features

- **🎨 Multi-Framework Support**: Generate code for Flutter, HTML, React, Tailwind, SwiftUI, and Compose
- **📱 Automatic Image Export**: Extract and export all images with multi-scale support (1x-4x)
- **📸 Screenshot API**: Generate high-quality screenshots of specific Figma nodes
- **🔄 Smart Layout Detection**: Automatically detects auto-layouts and generates appropriate widgets (Column/Row vs Stack)
- **🚫 Conflict-Free Naming**: Node ID-based image naming prevents filename conflicts
- **⚡ Concurrent Processing**: Parallel image downloads for optimal performance
- **🎯 Selective Export**: Filter and export specific images by name
- **📁 Organized Output**: Structured directory layout for different scales and formats

## How it works

The API uses a sophisticated multi-step process to transform Figma designs into production-ready code:

1. **Figma API Integration**: Fetches design data directly from Figma using REST API endpoints
2. **Node Analysis**: Converts Figma nodes into optimized intermediate representations
3. **Layout Intelligence**: Detects auto-layouts, containers, and positioning patterns
4. **Image Processing**: Extracts, downloads, and optimizes all image assets
5. **Code Generation**: Transforms the structure into framework-specific code with proper image integration

![Conversion Workflow](assets/workflow.png)

This approach ensures clean, maintainable output with proper asset management and framework-specific optimizations.

## Quick Start

1. **Install dependencies**:
   ```bash
   cd apps/api-server
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your Figma token
   echo "FIGMA_TOKEN=your_figma_token_here" > .env
   ```

3. **Start the API server**:
   ```bash
   npm run dev  # Development mode (port 3001)
   npm run start  # Production mode
   ```

4. **Convert your first design**:
   ```bash
   curl -X POST http://localhost:3001/api/convert \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://www.figma.com/design/YOUR_FILE_KEY/Design?node-id=NODE_ID",
       "exportImages": true,
       "settings": { "framework": "Flutter" }
     }'
   ```

## Architecture

The REST API is built on a monorepo structure:

- `apps/api-server` - Express.js REST API server with TypeScript
- `packages/backend` - Core business logic for Figma API integration and code generation
- `packages/types` - Shared TypeScript interfaces and types

### Key Components

- **FigmaClient**: Handles Figma REST API communication and authentication
- **ImageExporter**: Manages multi-scale image downloads with conflict-free naming
- **CodeGenerator**: Transforms Figma nodes into framework-specific code
- **FigmaAdapter**: Converts Figma API responses to internal node representations

## API Endpoints

### 1. Convert to Code (`POST /api/convert`)

Converts Figma designs to code with optional image export.

**Request Body**:
```json
{
  "url": "https://www.figma.com/design/FILE_KEY/Design-Name?node-id=NODE_ID",
  "token": "figd_xxxxx",  // Optional if FIGMA_TOKEN env var is set
  "settings": {
    "framework": "Flutter",  // HTML, Tailwind, Flutter, SwiftUI, Compose
    "showLayerNames": false,
    "responsiveRoot": false,
    "flutterGenerationMode": "snippet"
  },
  "exportImages": true,
  "exportImagesOptions": {
    "scales": ["1x", "2x", "3x", "4x"],
    "formats": ["png"],
    "directory": "./images",
    "pathPrefix": "assets/"
  },
  "output": {
    "saveToFile": true,
    "directory": "./output",
    "filename": "generated_widget.dart"
  }
}
```

**Response**:
```json
{
  "code": "Container(\n  width: 375,\n  height: 812,\n  child: ...\n)",
  "htmlPreview": "<div>...</div>",
  "colors": ["#000000", "#FFFFFF"],
  "gradients": [],
  "warnings": [],
  "exportedImages": {
    "40614:121024": {
      "1x": { "png": "1x/40614-121024_iphone_13_mini.png" },
      "2x": { "png": "2x/40614-121024_iphone_13_mini_2x.png" }
    }
  },
  "filePath": "./output/generated_widget.dart"
}
```

### 2. Export Images (`POST /api/export-images`)

Standalone image export with node mapping for flexible usage.

**Request Body**:
```json
{
  "url": "https://www.figma.com/design/FILE_KEY/Design-Name?node-id=NODE_ID",
  "token": "figd_xxxxx",  // Optional if FIGMA_TOKEN env var is set
  "imageNames": ["40614-121089_ellipse_14499", "40614-121152_google-messages-icon"],  // Optional: filter specific images
  "exportOptions": {
    "scales": ["1x", "2x", "3x", "4x"],
    "formats": ["png", "svg"],
    "directory": "./exported-images"
  }
}
```

**Response**:
```json
{
  "images": {
    "40614:121089": {
      "1x": { "png": "1x/40614-121089_ellipse_14499.png", "svg": "1x/40614-121089_ellipse_14499.svg" },
      "2x": { "png": "2x/40614-121089_ellipse_14499_2x.png" }
    },
    "40614:121152": {
      "1x": { "png": "1x/40614-121152_google-messages-icon.png" }
    }
  },
  "mapping": {
    "40614-121089_ellipse_14499": "40614:121089",
    "40614-121152_google-messages-icon": "40614:121152"
  },
  "totalNodes": 12,
  "exportedNodes": 2
}
```

**Use Cases**:
- Export all images first, then selectively re-export specific ones as SVG
- Get node mapping to understand which images correspond to which Figma nodes
- Batch export images without generating code

### 3. Screenshot (`POST /api/screenshot`)

Generate screenshots of specific Figma nodes using direct Figma API.

**Request Body**:
```json
{
  "url": "https://www.figma.com/design/FILE_KEY/Design-Name?node-id=NODE_ID",
  "token": "figd_xxxxx",  // Optional if FIGMA_TOKEN env var is set
  "scale": 2,  // 0.5-4, default: 2
  "format": "png",  // png, svg, jpg
  "saveToFile": true,  // Optional: save locally
  "directory": "./screenshots"  // Optional: custom directory
}
```

**Response**:
```json
{
  "imageUrl": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/xxx",
  "nodeId": "40614:121023",
  "scale": 2,
  "format": "png",
  "filePath": "./screenshots/screenshot_40614-121023_2x.png"  // If saveToFile=true
}
```

## Key Features

### Image Naming Convention
All exported images use the format `{nodeId}_{originalName}` to prevent naming conflicts:
- `40614-121089_ellipse_14499.png`
- `40614-121093_ellipse_14499.png`
- `40614-121097_ellipse_14499.png`

This ensures unique filenames even when multiple nodes have identical names.

### Multi-Scale Support
Images are exported in multiple scales with proper directory structure:
```
images/
├── 1x/
│   ├── 40614-121089_ellipse_14499.png
│   └── 40614-121152_google-messages-icon.png
├── 2x/
│   ├── 40614-121089_ellipse_14499_2x.png
│   └── 40614-121152_google-messages-icon_2x.png
├── 3x/
└── 4x/
```

### Generated Code Integration
The convert API automatically integrates exported images into the generated code:
```dart
Container(
  decoration: BoxDecoration(
    image: DecorationImage(
      image: AssetImage("1x/40614-121024_iphone_13_mini.png"),
      fit: BoxFit.cover,
    ),
  ),
)
```

### Error Handling
All endpoints include comprehensive error handling with meaningful messages:
- Invalid Figma URLs
- Authentication failures
- Missing nodes
- Export failures
- File system errors

## Example Workflows

### Complete Flutter App Generation
```bash
# Generate Flutter widget with all images exported
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.figma.com/design/YOUR_FILE_KEY/Design?node-id=NODE_ID",
    "exportImages": true,
    "exportImagesOptions": {
      "scales": ["1x", "2x", "3x"],
      "formats": ["png"],
      "directory": "./assets/images"
    },
    "settings": {
      "framework": "Flutter",
      "flutterGenerationMode": "snippet"
    },
    "output": {
      "saveToFile": true,
      "filename": "home_screen.dart"
    }
  }'
```

### Selective Image Export for Icons
```bash
# Export specific icons as SVG for scalability
curl -X POST http://localhost:3001/api/export-images \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.figma.com/design/YOUR_FILE_KEY/Design?node-id=NODE_ID",
    "imageNames": ["40614-121152_google-messages-icon", "40614-121146_path"],
    "exportOptions": {
      "formats": ["svg"],
      "directory": "./assets/icons"
    }
  }'
```

### Design Documentation Screenshots
```bash
# Generate high-resolution design screenshots
curl -X POST http://localhost:3001/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.figma.com/design/YOUR_FILE_KEY/Design?node-id=NODE_ID",
    "scale": 4,
    "format": "png",
    "saveToFile": true,
    "directory": "./docs/screenshots"
  }'
```

## Development

### Running Locally
```bash
# Install dependencies
pnpm install

# Start API server
cd apps/api-server
npm run dev
```

### Testing
```bash
# Type checking
npm run typecheck

# Linting
npm run lint
```

## Contributing

Found a bug or have an idea for improvement? Feel free to [open an issue](https://github.com/prateekmedia/FigmaToCode-RestApi/issues) or submit a pull request. Contributions are welcome!

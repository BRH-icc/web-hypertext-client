# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Essential Commands

### Development Setup
```bash
# Install dependencies
npm install

# Start development server (React + Electron concurrently)
npm run dev

# Start only Electron main process (requires built renderer)
npm run dev-main

# Start only React development server
npm run dev-renderer
```

### Building and Distribution
```bash
# Build for production (both main and renderer)
npm run build

# Build main process only
npm run build-main

# Build renderer process only
npm run build-renderer

# Create distributables for all platforms
npm run dist

# Platform-specific builds
npm run dist:win    # Windows (NSIS installer)
npm run dist:mac    # macOS (DMG)
npm run dist:linux  # Linux (AppImage)
```

### Code Quality
```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Quick Start for Development
```bash
npm install
npm run dev
```
The app will open automatically. DevTools are enabled in development mode.

## Architecture Overview

This is an Electron-based desktop application that recreates the original World Wide Web vision with modern collaborative hypertext editing capabilities.

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              src/main/main.js                           │ │
│  │  • Window management & lifecycle                        │ │
│  │  • Application menus                                    │ │
│  │  • IPC message routing                                  │ │
│  │  • File system operations                               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                 │
                          ┌─────────────┐
                          │ Preload     │
                          │ Bridge      │
                          └─────────────┘
                                 │
┌─────────────────────────────────────────────────────────────┐
│                   React Renderer Process                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   App.js (Main UI)                      │ │
│  │  • Tab navigation (Browser/Editor/Knowbot/Export)       │ │
│  │  • Document state management                            │ │
│  │  • Menu event handling                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                 │                           │
│  ┌─────────────────┬─────────────┬─────────────┬───────────┐ │
│  │ ClientBrowser   │ Hypertext   │ Knowbot     │ Export    │ │
│  │ Component       │ Editor      │ Panel       │ Panel     │ │
│  │                 │             │             │           │ │
│  │ • Web browsing  │ • ProseMirror│ • Web       │ • PDF/    │ │
│  │ • Page source   │   editor     │   crawler   │   TeX/    │ │
│  │ • Bookmarks     │ • Real-time  │ • Search    │   HTML    │ │
│  │ • History       │   collab     │   indexing  │   export  │ │
│  └─────────────────┴─────────────┴─────────────┴───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key File Locations

- **Main Process**: `src/main/main.js`
- **Preload Script**: `src/preload/preload.js` 
- **React App**: `src/renderer/App.js`
- **Components**: `client/`, `hypertext-editor/`, `knowbot/`, `export-engine/`

## IPC Communication Patterns

The application uses a secure IPC architecture with contextBridge isolation:

### API Namespaces Exposed via Preload
```javascript
// Available in renderer via window.electronAPI
electronAPI: {
  getAppVersion(), showSaveDialog(), showMessageBox(),
  onMenuNewDocument(), onMenuSave(), onMenuExportPdf(), ...
}

// Available in renderer via window.hypertextAPI  
hypertextAPI: {
  createDocument(), openDocument(), saveDocument(),
  connectToCollaboration(), onCollaborativeUpdate(), ...
}

// Available in renderer via window.knowbotAPI
knowbotAPI: {
  startCrawl(), stopCrawl(), search(), getIndex(),
  onCrawlProgress(), onCrawlComplete(), ...
}

// Available in renderer via window.exportAPI
exportAPI: {
  exportToPdf(), exportToTex(), exportToHtml(),
  onExportProgress(), onExportComplete(), ...
}
```

### Adding New IPC Handlers

1. **Main Process** (`src/main/main.js`): Add `ipcMain.handle()` for requests or `ipcMain.on()` for events
2. **Preload** (`src/preload/preload.js`): Expose method via `contextBridge.exposeInMainWorld()`
3. **Renderer**: Call via appropriate API namespace (e.g., `window.electronAPI.newMethod()`)

Example pattern:
```javascript
// main.js
ipcMain.handle('my-new-operation', async (event, data) => {
  // Process request
  return result;
});

// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  myNewOperation: (data) => ipcRenderer.invoke('my-new-operation', data)
});

// renderer component
const result = await window.electronAPI.myNewOperation(data);
```

## ProseMirror Integration

### Schema Architecture
The hypertext editor uses an extended ProseMirror schema (`hypertext-editor/HypertextEditor.js`):

```javascript
// Custom nodes added to basic schema
nodes: {
  hyperlink: { /* Clickable links with href/title */ },
  annotation: { /* User annotations with author/timestamp */ }
}

// Custom marks for collaborative features
marks: {
  comment: { /* Inline comments with metadata */ }
}
```

### Editor Lifecycle
1. **Mount**: React component creates EditorView in `useEffect`
2. **State**: EditorState initialized with document content or empty doc
3. **Plugins**: Basic setup + collaboration plugin (if enabled)
4. **Transactions**: Dispatch handler updates state and notifies parent via `onChange`
5. **Unmount**: EditorView destroyed in cleanup

### Collaborative Editing
- Uses `prosemirror-collab` plugin
- Sendable steps transmitted via IPC to collaboration server
- Remote updates received via `onCollaborativeUpdate` listener
- Version-based conflict resolution

## Component Architecture Patterns

### Tab-Based Navigation
The main App component uses a simple tab state system:
- `activeTab` state controls which component renders
- Menu actions can switch tabs (e.g., "Start Crawl" → Knowbot tab)
- Components communicate via callback props for cross-tab actions

### State Flow Pattern
```
Document State (App.js) 
    ↓ props
HypertextEditor Component
    ↓ onChange callback  
Document State Updated
    ↓ props
Export/Other Components
```

### Mocked Services in Development
Each major component includes fallback mock implementations:
- **ClientBrowser**: Mock HTTP requests with CERN/W3C content
- **KnowbotPanel**: Simulated crawling with predefined results
- **ExportPanel**: Mock export process with progress simulation

This allows development without backend services.

## Development Workflow

### Component Development
1. Components are self-contained in their own directories
2. Each has a `.js` file and corresponding `.css` file
3. Integration happens through the main App.js component
4. Use callback props for parent communication

### Testing Strategy
- **Unit tests**: Individual component logic (Jest configuration in package.json)
- **Integration tests**: Component interaction patterns  
- **E2E tests**: Full Electron application workflows

Run single test: `npm test -- --testNamePattern="ComponentName"`

### Building Features

1. **New React Component**: Create in appropriate directory with CSS
2. **IPC Communication**: Add handlers to main process and preload exposure
3. **Integration**: Import and use in App.js with proper prop passing
4. **Menu Integration**: Add menu items in `createApplicationMenu()` if needed

### File System Organization
```
src/
├── main/           # Electron main process
├── preload/        # IPC bridge (security boundary)
└── renderer/       # React app entry

component-name/     # Feature components (top-level)
├── ComponentName.js
├── ComponentName.css
└── subcomponents/  # If complex
```

## Key Dependencies

### Core Framework
- **Electron ^25.2.0**: Desktop app framework
- **React ^18.2.0**: UI library  
- **ProseMirror**: Rich text editing engine

### Specialized Libraries
- **cheerio**: HTML parsing for web crawling
- **puppeteer**: Browser automation for content extraction
- **pdf-lib**: PDF generation
- **latex.js**: TeX processing
- **socket.io**: Real-time collaboration
- **sqlite3**: Local data storage

### Build Tools
- **Webpack 5**: Module bundling
- **Babel**: JavaScript transpilation
- **electron-builder**: Application packaging
- **concurrently**: Parallel script execution

## Historical Context

This application recreates the original vision of the World Wide Web as both a browsing and authoring medium, inspired by Tim Berners-Lee's original WorldWideWeb browser-editor. The four main components (Browser, Editor, Crawler, Export) work together to enable the collaborative, editable web originally envisioned at CERN in 1989.

The architecture balances modern development practices (React, TypeScript) with the collaborative hypertext editing paradigm that made the early web special.
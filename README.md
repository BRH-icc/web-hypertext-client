# Web Hypertext Client

A cross-platform desktop application that recreates the vision of the original World Wide Web, combining modern web browsing with collaborative hypertext editing, intelligent web crawling, and document publishing capabilities.

## 🌟 Features

### 🌐 Cross-Platform Web Browser
- Multi-platform support (Windows, macOS, Linux)
- Clean, intuitive interface inspired by early web browsers
- Bookmarks management and history tracking
- Page source viewing and analysis
- Direct integration with the hypertext editor

### ✍️ Collaborative Hypertext Editor
- Rich text editing with hyperlink support
- Real-time collaborative editing capabilities
- Annotation and commenting system
- ProseMirror-based editing engine
- Export capabilities to multiple formats

### 🤖 Knowbot - Intelligent Web Crawler
- Recursive web page crawling and indexing
- Configurable crawl depth and settings
- Full-text search across indexed content
- Link analysis and relationship mapping
- Respect for robots.txt and crawl delays

### 📄 Document Export Engine
- Export to PDF, LaTeX, and HTML formats
- Customizable document styling and formatting
- Batch processing of multiple pages
- Template system for consistent output
- Export history and management

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Git (optional, for version control)

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd web-hypertext-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Create distributable packages**
   ```bash
   # For current platform
   npm run dist
   
   # For specific platforms
   npm run dist:win    # Windows
   npm run dist:mac    # macOS
   npm run dist:linux  # Linux
   ```

## 📁 Project Structure

```
web-hypertext-client/
├── src/                          # Source code
│   ├── main/                     # Electron main process
│   │   └── main.js              # Main Electron entry point
│   ├── preload/                 # Preload scripts
│   │   └── preload.js          # IPC bridge
│   └── renderer/                # React renderer process
│       ├── App.js              # Main application component
│       └── App.css             # Application styles
├── client/                      # Web browser component
│   ├── ClientBrowser.js        # Browser interface
│   ├── ClientBrowser.css       # Browser styles
│   └── shared/                 # Shared browser utilities
├── hypertext-editor/           # Collaborative editor
│   ├── HypertextEditor.js      # Editor component
│   ├── HypertextEditor.css     # Editor styles
│   ├── components/             # Editor sub-components
│   └── collaboration/          # Real-time collaboration
├── knowbot/                    # Web crawler system
│   ├── KnowbotPanel.js        # Crawler interface
│   ├── KnowbotPanel.css       # Crawler styles
│   ├── crawler/               # Crawling engine
│   └── indexer/               # Search indexing
├── export-engine/             # Document export system
│   ├── ExportPanel.js         # Export interface
│   ├── ExportPanel.css        # Export styles
│   └── formats/               # Export format handlers
├── docs/                      # Documentation
├── tests/                     # Test files
├── package.json               # Project configuration
└── README.md                  # This file
```

## 🎯 Usage Guide

### Web Browsing
1. **Navigate**: Use the address bar to visit websites
2. **Bookmarks**: Click the star icon to bookmark pages
3. **History**: Navigate back/forward through visited pages
4. **Edit Pages**: Click the edit button to open content in the hypertext editor

### Hypertext Editing
1. **Create**: Start with a new document or import web content
2. **Edit**: Use the rich text editor with formatting tools
3. **Collaborate**: Enable collaboration mode for real-time editing
4. **Links**: Insert hyperlinks using the link tool
5. **Annotate**: Add annotations and comments to text

### Web Crawling (Knowbot)
1. **Configure**: Set crawl parameters (depth, delay, etc.)
2. **Start**: Enter a starting URL and begin crawling
3. **Monitor**: Watch progress in real-time
4. **Search**: Use the search interface to find indexed content
5. **Analyze**: View crawl results and page relationships

### Document Export
1. **Select**: Choose content to export (current document or crawl results)
2. **Format**: Pick export format (PDF, LaTeX, HTML)
3. **Configure**: Set document options (title, styling, etc.)
4. **Preview**: Review the export before generating
5. **Export**: Create the final document

## ⚙️ Configuration

### Crawl Settings
- **Max Depth**: How deep to crawl (1-10 levels)
- **Max Pages**: Maximum number of pages to index
- **Delay**: Time between requests (milliseconds)
- **Robots.txt**: Respect website crawling policies
- **External Links**: Follow links to other domains

### Export Options
- **Page Size**: A4, Letter, Legal, A3
- **Font**: Font family and size
- **Margins**: Document margins
- **Headers/Footers**: Custom headers and footers
- **Table of Contents**: Auto-generate TOC
- **Page Numbers**: Include page numbering

## 🔧 Development

### Architecture

The application is built using:
- **Electron**: Cross-platform desktop framework
- **React**: UI component library
- **ProseMirror**: Rich text editor engine
- **Node.js**: Backend processing

### Key Components

1. **Main Process** (`src/main/main.js`)
   - Handles window management
   - Sets up IPC communication
   - Manages application lifecycle

2. **Renderer Process** (`src/renderer/App.js`)
   - Main UI application
   - Tab management and navigation
   - Component coordination

3. **Preload Script** (`src/preload/preload.js`)
   - Secure IPC bridge
   - API exposure to renderer
   - Security context isolation

### Building Components

Each major feature is organized as a separate component:
- Self-contained with its own CSS
- Communicates via props and callbacks
- Uses Electron APIs through the preload bridge

### Adding Features

1. Create component in appropriate directory
2. Add styles in corresponding CSS file
3. Integrate with main App component
4. Add any required IPC handlers in main process
5. Update preload script if new APIs needed

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 📦 Building and Distribution

### Development Build
```bash
npm run build
```

### Production Packages
```bash
# All platforms
npm run dist

# Platform-specific
npm run dist:win
npm run dist:mac  
npm run dist:linux
```

### Build Configuration

Build settings are configured in `package.json` under the `build` section:
- App ID and product name
- Output directories
- Platform-specific options
- File associations and protocols

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Submit a pull request

### Code Style

- Use ES6+ JavaScript features
- Follow React best practices
- Use semantic CSS class names
- Add comments for complex logic
- Maintain consistent indentation

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
- Ensure Node.js 16+ is installed
- Delete `node_modules` and run `npm install`
- Check for port conflicts on development server

**Crawling fails**
- Check internet connection
- Verify target website allows crawling
- Adjust crawl delay settings
- Check firewall/proxy settings

**Export errors**
- Verify export directory permissions
- Check available disk space
- Ensure proper document formatting
- Try different export formats

**Editor issues**
- Clear browser cache in development
- Check for JavaScript console errors
- Verify ProseMirror dependencies
- Test with simple documents first

### Getting Help

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information:
   - Operating system and version
   - Node.js and npm versions
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - Error messages or logs

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tim Berners-Lee** and **CERN** for creating the World Wide Web
- **ProseMirror** team for the excellent rich text editor
- **Electron** team for making cross-platform desktop apps possible
- **React** team for the component framework
- The **open source community** for countless libraries and tools

## 🎖️ Historical Context

This project is inspired by the original vision of the World Wide Web as conceived by Tim Berners-Lee at CERN in 1989. The original proposal described a system that was not just for reading, but for writing, editing, and collaborating on hypertext documents.

The early web browsers like WorldWideWeb (later renamed Nexus) were both browsers and editors, allowing users to:
- Browse the web
- Create and edit hypertext documents
- Collaborate on content creation
- Link between documents seamlessly

This application attempts to recreate and modernize that original vision, combining the best of modern web technology with the collaborative, editable web that was originally envisioned.

---

*"The original idea of the web was that it should be a collaborative space where you can communicate through sharing information." - Tim Berners-Lee*
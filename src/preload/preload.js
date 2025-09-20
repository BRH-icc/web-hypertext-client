const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Menu event listeners
  onMenuNewDocument: (callback) => ipcRenderer.on('menu-new-document', callback),
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  onMenuExportPdf: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  onMenuExportTex: (callback) => ipcRenderer.on('menu-export-tex', callback),
  onMenuStartCrawl: (callback) => ipcRenderer.on('menu-start-crawl', callback),
  onMenuSearch: (callback) => ipcRenderer.on('menu-search', callback),

  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expose hypertext editor API
contextBridge.exposeInMainWorld('hypertextAPI', {
  // Document operations
  createDocument: () => ipcRenderer.invoke('hypertext-create-document'),
  openDocument: (path) => ipcRenderer.invoke('hypertext-open-document', path),
  saveDocument: (content, path) => ipcRenderer.invoke('hypertext-save-document', content, path),
  
  // Collaborative features
  connectToCollaboration: (sessionId) => ipcRenderer.invoke('hypertext-connect-collab', sessionId),
  disconnectFromCollaboration: () => ipcRenderer.invoke('hypertext-disconnect-collab'),
  onCollaborativeUpdate: (callback) => ipcRenderer.on('hypertext-collab-update', callback),
  
  // Link management
  extractLinks: (content) => ipcRenderer.invoke('hypertext-extract-links', content),
  validateLinks: (links) => ipcRenderer.invoke('hypertext-validate-links', links)
});

// Expose knowbot API
contextBridge.exposeInMainWorld('knowbotAPI', {
  // Crawling operations
  startCrawl: (startUrl, options) => ipcRenderer.invoke('knowbot-start-crawl', startUrl, options),
  stopCrawl: () => ipcRenderer.invoke('knowbot-stop-crawl'),
  getCrawlStatus: () => ipcRenderer.invoke('knowbot-get-status'),
  onCrawlProgress: (callback) => ipcRenderer.on('knowbot-crawl-progress', callback),
  onCrawlComplete: (callback) => ipcRenderer.on('knowbot-crawl-complete', callback),
  
  // Search operations
  search: (query, options) => ipcRenderer.invoke('knowbot-search', query, options),
  getIndex: () => ipcRenderer.invoke('knowbot-get-index'),
  clearIndex: () => ipcRenderer.invoke('knowbot-clear-index'),
  
  // Page analysis
  analyzePage: (url) => ipcRenderer.invoke('knowbot-analyze-page', url),
  getPageContent: (url) => ipcRenderer.invoke('knowbot-get-page-content', url)
});

// Expose export API
contextBridge.exposeInMainWorld('exportAPI', {
  // PDF export
  exportToPdf: (content, options) => ipcRenderer.invoke('export-to-pdf', content, options),
  
  // TeX export
  exportToTex: (content, options) => ipcRenderer.invoke('export-to-tex', content, options),
  
  // HTML export
  exportToHtml: (content, options) => ipcRenderer.invoke('export-to-html', content, options),
  
  // Progress tracking
  onExportProgress: (callback) => ipcRenderer.on('export-progress', callback),
  onExportComplete: (callback) => ipcRenderer.on('export-complete', callback),
  onExportError: (callback) => ipcRenderer.on('export-error', callback)
});

// Utility functions
contextBridge.exposeInMainWorld('utils', {
  platform: process.platform,
  
  // Path operations
  joinPath: (...parts) => require('path').join(...parts),
  dirname: (path) => require('path').dirname(path),
  basename: (path) => require('path').basename(path),
  
  // URL operations
  isValidUrl: (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
});
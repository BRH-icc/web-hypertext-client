import React, { useState, useEffect } from 'react';
import './ExportPanel.css';

const ExportPanel = ({ document, crawlResults }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeImages: true,
    includeLinks: true,
    includeMetadata: true,
    pageSize: 'A4',
    orientation: 'portrait',
    fontSize: 12,
    fontFamily: 'Times New Roman',
    margins: 'normal',
    tableOfContents: false,
    pageNumbers: true,
    header: '',
    footer: '',
    title: '',
    author: '',
    subject: '',
    keywords: ''
  });
  const [exportStatus, setExportStatus] = useState('idle'); // idle, processing, completed, error
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, stage: '' });
  const [exportHistory, setExportHistory] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [previewContent, setPreviewContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Set up export event listeners
    if (window.exportAPI) {
      const handleExportProgress = (event, progress) => {
        setExportProgress(progress);
      };

      const handleExportComplete = (event, result) => {
        setExportStatus('completed');
        setExportHistory(prev => [{
          id: Date.now(),
          format: exportFormat,
          filename: result.filename,
          size: result.size,
          timestamp: new Date().toISOString(),
          path: result.path
        }, ...prev]);
      };

      const handleExportError = (event, error) => {
        setExportStatus('error');
        console.error('Export failed:', error);
      };

      window.exportAPI.onExportProgress(handleExportProgress);
      window.exportAPI.onExportComplete(handleExportComplete);
      window.exportAPI.onExportError(handleExportError);

      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners('export-progress');
          window.electronAPI.removeAllListeners('export-complete');
          window.electronAPI.removeAllListeners('export-error');
        }
      };
    }
  }, [exportFormat]);

  const startExport = async () => {
    if (!document && selectedPages.length === 0) {
      alert('No content to export. Please open a document or select pages from crawl results.');
      return;
    }

    setExportStatus('processing');
    setExportProgress({ current: 0, total: 100, stage: 'Preparing export...' });

    try {
      const contentToExport = selectedPages.length > 0 
        ? selectedPages.map(page => ({
            title: page.title,
            content: page.content,
            url: page.url
          }))
        : [{
            title: document.title || 'Document',
            content: document.content,
            url: document.path
          }];

      if (window.exportAPI) {
        const result = await window.exportAPI[`exportTo${exportFormat.charAt(0).toUpperCase() + exportFormat.slice(1)}`](
          contentToExport,
          exportOptions
        );
        
        setExportStatus('completed');
        setExportHistory(prev => [{
          id: Date.now(),
          format: exportFormat,
          filename: result.filename,
          size: formatBytes(result.size),
          timestamp: new Date().toISOString(),
          path: result.path
        }, ...prev]);
      } else {
        // Mock export process
        await mockExport();
      }
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
    }
  };

  const mockExport = async () => {
    // Simulate export process
    const stages = [
      'Analyzing content...',
      'Processing formatting...',
      'Generating document...',
      'Optimizing output...',
      'Finalizing export...'
    ];

    for (let i = 0; i < stages.length; i++) {
      setExportProgress({
        current: ((i + 1) / stages.length) * 100,
        total: 100,
        stage: stages[i]
      });
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const mockResult = {
      filename: `export_${Date.now()}.${exportFormat}`,
      size: Math.floor(Math.random() * 1000000) + 100000,
      path: `./exports/export_${Date.now()}.${exportFormat}`
    };

    setExportStatus('completed');
    setExportHistory(prev => [{
      id: Date.now(),
      format: exportFormat,
      filename: mockResult.filename,
      size: formatBytes(mockResult.size),
      timestamp: new Date().toISOString(),
      path: mockResult.path
    }, ...prev]);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generatePreview = () => {
    const contentToPreview = selectedPages.length > 0 
      ? selectedPages 
      : document ? [document] : [];

    if (contentToPreview.length === 0) {
      setPreviewContent('<p>No content available for preview.</p>');
      return;
    }

    let preview = '';
    
    if (exportFormat === 'tex') {
      preview = generateTeXPreview(contentToPreview);
    } else if (exportFormat === 'html') {
      preview = generateHTMLPreview(contentToPreview);
    } else {
      preview = generatePDFPreview(contentToPreview);
    }

    setPreviewContent(preview);
    setShowPreview(true);
  };

  const generateTeXPreview = (content) => {
    let tex = `\\documentclass[${exportOptions.fontSize}pt]{article}\n`;
    tex += `\\usepackage[${exportOptions.pageSize.toLowerCase()}paper]{geometry}\n`;
    tex += `\\usepackage[utf8]{inputenc}\n`;
    tex += `\\usepackage{hyperref}\n`;
    
    if (exportOptions.title) {
      tex += `\\title{${exportOptions.title}}\n`;
    }
    if (exportOptions.author) {
      tex += `\\author{${exportOptions.author}}\n`;
    }
    
    tex += `\\begin{document}\n\n`;
    
    if (exportOptions.title) {
      tex += `\\maketitle\n\n`;
    }
    
    if (exportOptions.tableOfContents) {
      tex += `\\tableofcontents\n\\newpage\n\n`;
    }

    content.forEach((item, index) => {
      if (item.title) {
        tex += `\\section{${item.title}}\n\n`;
      }
      
      // Convert HTML content to basic TeX
      let texContent = item.content || '';
      texContent = texContent.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\\subsection{$1}\n\n');
      texContent = texContent.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\\subsubsection{$1}\n\n');
      texContent = texContent.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
      texContent = texContent.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '\\textbf{$1}');
      texContent = texContent.replace(/<em[^>]*>(.*?)<\/em>/gi, '\\textit{$1}');
      texContent = texContent.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '\\href{$1}{$2}');
      texContent = texContent.replace(/<[^>]*>/g, '');
      
      tex += texContent + '\n\n';
      
      if (index < content.length - 1) {
        tex += '\\newpage\n\n';
      }
    });

    tex += `\\end{document}`;
    return tex;
  };

  const generateHTMLPreview = (content) => {
    let html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n`;
    html += `  <meta charset="UTF-8">\n`;
    html += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
    
    if (exportOptions.title) {
      html += `  <title>${exportOptions.title}</title>\n`;
    }
    
    html += `  <style>\n`;
    html += `    body { font-family: ${exportOptions.fontFamily}, serif; font-size: ${exportOptions.fontSize}px; }\n`;
    html += `    .page { margin: 2cm; }\n`;
    html += `    .page-break { page-break-before: always; }\n`;
    html += `  </style>\n`;
    html += `</head>\n<body>\n\n`;

    content.forEach((item, index) => {
      if (index > 0) {
        html += `<div class="page-break"></div>\n`;
      }
      
      html += `<div class="page">\n`;
      
      if (item.title) {
        html += `  <h1>${item.title}</h1>\n`;
      }
      
      html += `  ${item.content || ''}\n`;
      html += `</div>\n\n`;
    });

    html += `</body>\n</html>`;
    return html;
  };

  const generatePDFPreview = (content) => {
    let preview = `PDF Export Preview\n`;
    preview += `Format: ${exportFormat.toUpperCase()}\n`;
    preview += `Page Size: ${exportOptions.pageSize}\n`;
    preview += `Font: ${exportOptions.fontFamily}, ${exportOptions.fontSize}pt\n\n`;
    
    content.forEach((item, index) => {
      if (item.title) {
        preview += `${item.title}\n${'='.repeat(item.title.length)}\n\n`;
      }
      
      const textContent = item.content ? item.content.replace(/<[^>]*>/g, '') : '';
      preview += `${textContent.substring(0, 500)}...\n\n`;
      
      if (index < content.length - 1) {
        preview += `--- Page Break ---\n\n`;
      }
    });

    return preview;
  };

  const togglePageSelection = (page) => {
    setSelectedPages(prev => {
      const isSelected = prev.some(p => p.url === page.url);
      if (isSelected) {
        return prev.filter(p => p.url !== page.url);
      } else {
        return [...prev, page];
      }
    });
  };

  const selectAllPages = () => {
    setSelectedPages([...crawlResults]);
  };

  const clearSelection = () => {
    setSelectedPages([]);
  };

  return (
    <div className="export-panel">
      <div className="export-header">
        <h2>📄 Export & Print Manager</h2>
        <div className="export-stats">
          <span>Format: {exportFormat.toUpperCase()}</span>
          <span>Pages: {selectedPages.length || (document ? 1 : 0)}</span>
          <span>History: {exportHistory.length}</span>
        </div>
      </div>

      <div className="export-content">
        <div className="export-controls">
          {/* Format Selection */}
          <div className="control-section">
            <h3>Export Format</h3>
            <div className="format-options">
              <label className={`format-option ${exportFormat === 'pdf' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <div className="format-icon">📕</div>
                <span>PDF</span>
              </label>
              <label className={`format-option ${exportFormat === 'tex' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="tex"
                  checked={exportFormat === 'tex'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <div className="format-icon">📜</div>
                <span>LaTeX</span>
              </label>
              <label className={`format-option ${exportFormat === 'html' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="html"
                  checked={exportFormat === 'html'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <div className="format-icon">🌐</div>
                <span>HTML</span>
              </label>
            </div>
          </div>

          {/* Page Selection */}
          {crawlResults.length > 0 && (
            <div className="control-section">
              <h3>Select Pages</h3>
              <div className="selection-controls">
                <button onClick={selectAllPages} className="select-btn">Select All</button>
                <button onClick={clearSelection} className="clear-btn">Clear</button>
                <span className="selection-count">
                  {selectedPages.length} of {crawlResults.length} selected
                </span>
              </div>
              <div className="pages-list">
                {crawlResults.slice(0, 10).map((page, index) => (
                  <label key={index} className="page-item">
                    <input
                      type="checkbox"
                      checked={selectedPages.some(p => p.url === page.url)}
                      onChange={() => togglePageSelection(page)}
                    />
                    <div className="page-info">
                      <div className="page-title">{page.title}</div>
                      <div className="page-url">{page.url}</div>
                    </div>
                  </label>
                ))}
                {crawlResults.length > 10 && (
                  <div className="more-pages">
                    ...and {crawlResults.length - 10} more pages
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="control-section">
            <h3>Export Options</h3>
            <div className="options-grid">
              <label>
                Title:
                <input
                  type="text"
                  value={exportOptions.title}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  placeholder="Document title"
                />
              </label>
              <label>
                Author:
                <input
                  type="text"
                  value={exportOptions.author}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    author: e.target.value
                  }))}
                  placeholder="Author name"
                />
              </label>
              <label>
                Page Size:
                <select
                  value={exportOptions.pageSize}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    pageSize: e.target.value
                  }))}
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                  <option value="A3">A3</option>
                </select>
              </label>
              <label>
                Font Size:
                <input
                  type="number"
                  min="8"
                  max="24"
                  value={exportOptions.fontSize}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    fontSize: parseInt(e.target.value)
                  }))}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={exportOptions.includeImages}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeImages: e.target.checked
                  }))}
                />
                Include Images
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={exportOptions.includeLinks}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeLinks: e.target.checked
                  }))}
                />
                Include Links
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={exportOptions.tableOfContents}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    tableOfContents: e.target.checked
                  }))}
                />
                Table of Contents
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={exportOptions.pageNumbers}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    pageNumbers: e.target.checked
                  }))}
                />
                Page Numbers
              </label>
            </div>
          </div>

          {/* Export Actions */}
          <div className="export-actions">
            <button onClick={generatePreview} className="preview-btn">
              Preview
            </button>
            {exportStatus === 'processing' ? (
              <button className="export-btn processing" disabled>
                Processing...
              </button>
            ) : (
              <button onClick={startExport} className="export-btn">
                Export {exportFormat.toUpperCase()}
              </button>
            )}
          </div>

          {/* Export Progress */}
          {exportStatus === 'processing' && (
            <div className="export-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${exportProgress.current}%` }}
                />
              </div>
              <div className="progress-text">
                {Math.round(exportProgress.current)}% - {exportProgress.stage}
              </div>
            </div>
          )}
        </div>

        <div className="export-results">
          {showPreview && (
            <div className="preview-section">
              <div className="preview-header">
                <h3>Export Preview</h3>
                <button onClick={() => setShowPreview(false)} className="close-preview">×</button>
              </div>
              <div className="preview-content">
                <pre>{previewContent}</pre>
              </div>
            </div>
          )}

          <div className="history-section">
            <h3>Export History</h3>
            {exportHistory.length === 0 ? (
              <div className="no-history">No exports yet</div>
            ) : (
              <div className="history-list">
                {exportHistory.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-icon">
                      {item.format === 'pdf' ? '📕' : item.format === 'tex' ? '📜' : '🌐'}
                    </div>
                    <div className="history-info">
                      <div className="history-filename">{item.filename}</div>
                      <div className="history-meta">
                        <span>{item.size}</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="history-actions">
                      <button className="open-btn" title="Open file">📂</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
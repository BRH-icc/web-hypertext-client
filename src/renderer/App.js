import React, { useState, useEffect } from 'react';
import './App.css';
import HypertextEditor from '../hypertext-editor/HypertextEditor';
import KnowbotPanel from '../knowbot/KnowbotPanel';
import ExportPanel from '../export-engine/ExportPanel';
import ClientBrowser from '../client/ClientBrowser';

const App = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [currentDocument, setCurrentDocument] = useState(null);
  const [crawlResults, setCrawlResults] = useState([]);
  const [isConnectedToCollab, setIsConnectedToCollab] = useState(false);

  useEffect(() => {
    // Set up menu event listeners
    if (window.electronAPI) {
      window.electronAPI.onMenuNewDocument(() => {
        handleNewDocument();
      });

      window.electronAPI.onMenuOpenFile((event, filePath) => {
        handleOpenFile(filePath);
      });

      window.electronAPI.onMenuSave(() => {
        handleSaveDocument();
      });

      window.electronAPI.onMenuExportPdf(() => {
        setActiveTab('export');
        // Trigger PDF export
      });

      window.electronAPI.onMenuExportTex(() => {
        setActiveTab('export');
        // Trigger TeX export
      });

      window.electronAPI.onMenuStartCrawl(() => {
        setActiveTab('knowbot');
      });

      window.electronAPI.onMenuSearch(() => {
        setActiveTab('knowbot');
      });
    }

    return () => {
      // Cleanup listeners
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('menu-new-document');
        window.electronAPI.removeAllListeners('menu-open-file');
        window.electronAPI.removeAllListeners('menu-save');
        window.electronAPI.removeAllListeners('menu-export-pdf');
        window.electronAPI.removeAllListeners('menu-export-tex');
        window.electronAPI.removeAllListeners('menu-start-crawl');
        window.electronAPI.removeAllListeners('menu-search');
      }
    };
  }, []);

  const handleNewDocument = () => {
    setCurrentDocument({
      id: Date.now(),
      title: 'Untitled Document',
      content: '',
      path: null,
      modified: false
    });
    setActiveTab('editor');
  };

  const handleOpenFile = async (filePath) => {
    try {
      if (window.hypertextAPI) {
        const document = await window.hypertextAPI.openDocument(filePath);
        setCurrentDocument(document);
        setActiveTab('editor');
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      if (window.electronAPI) {
        window.electronAPI.showMessageBox({
          type: 'error',
          title: 'Error',
          message: 'Failed to open file',
          detail: error.message
        });
      }
    }
  };

  const handleSaveDocument = async () => {
    if (!currentDocument) return;

    try {
      let savePath = currentDocument.path;
      if (!savePath) {
        const result = await window.electronAPI.showSaveDialog({
          filters: [
            { name: 'HTML Files', extensions: ['html', 'htm'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        if (result.canceled) return;
        savePath = result.filePath;
      }

      if (window.hypertextAPI) {
        await window.hypertextAPI.saveDocument(currentDocument.content, savePath);
        setCurrentDocument(prev => ({
          ...prev,
          path: savePath,
          modified: false
        }));
      }
    } catch (error) {
      console.error('Failed to save document:', error);
      if (window.electronAPI) {
        window.electronAPI.showMessageBox({
          type: 'error',
          title: 'Error',
          message: 'Failed to save document',
          detail: error.message
        });
      }
    }
  };

  const handleDocumentChange = (content) => {
    setCurrentDocument(prev => prev ? {
      ...prev,
      content,
      modified: true
    } : null);
  };

  const handleCrawlResults = (results) => {
    setCrawlResults(results);
  };

  return (
    <div className=\"app\">
      <header className=\"app-header\">
        <div className=\"app-title\">
          <h1>Web Hypertext Client</h1>
          <span className=\"version\">v1.0.0</span>
        </div>
        <nav className=\"tab-navigation\">
          <button 
            className={`tab ${activeTab === 'browser' ? 'active' : ''}`}
            onClick={() => setActiveTab('browser')}
          >
            Browser
          </button>
          <button 
            className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
          <button 
            className={`tab ${activeTab === 'knowbot' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowbot')}
          >
            Knowbot
          </button>
          <button 
            className={`tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
        </nav>
        {isConnectedToCollab && (
          <div className=\"collaboration-status\">
            <span className=\"status-indicator online\"></span>
            Collaborative Session Active
          </div>
        )}
      </header>

      <main className=\"app-main\">
        {activeTab === 'browser' && (
          <ClientBrowser 
            onPageSelect={(content) => {
              setCurrentDocument({
                id: Date.now(),
                title: 'Web Page',
                content: content,
                path: null,
                modified: false
              });
              setActiveTab('editor');
            }}
          />
        )}
        
        {activeTab === 'editor' && (
          <HypertextEditor
            document={currentDocument}
            onChange={handleDocumentChange}
            isCollaborative={isConnectedToCollab}
            onCollaborationToggle={setIsConnectedToCollab}
          />
        )}

        {activeTab === 'knowbot' && (
          <KnowbotPanel
            onCrawlResults={handleCrawlResults}
            onPageSelect={(url, content) => {
              setCurrentDocument({
                id: Date.now(),
                title: `Page: ${url}`,
                content: content,
                path: null,
                modified: false
              });
              setActiveTab('editor');
            }}
          />
        )}

        {activeTab === 'export' && (
          <ExportPanel
            document={currentDocument}
            crawlResults={crawlResults}
          />
        )}
      </main>

      <footer className=\"app-footer\">
        <div className=\"status-bar\">
          <span>
            {currentDocument 
              ? `${currentDocument.title}${currentDocument.modified ? ' (modified)' : ''}`
              : 'No document open'
            }
          </span>
          <span>Ready</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
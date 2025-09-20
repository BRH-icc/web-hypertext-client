import React, { useState, useRef, useEffect } from 'react';
import './ClientBrowser.css';

const ClientBrowser = ({ onPageSelect }) => {
  const [currentUrl, setCurrentUrl] = useState('https://info.cern.ch');
  const [pageHistory, setPageHistory] = useState(['https://info.cern.ch']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState([
    { id: 1, title: 'CERN - World Wide Web', url: 'https://info.cern.ch' },
    { id: 2, title: 'World Wide Web Consortium', url: 'https://www.w3.org' },
    { id: 3, title: 'Tim Berners-Lee', url: 'https://www.w3.org/People/Berners-Lee/' }
  ]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [pageContent, setPageContent] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [showPageSource, setShowPageSource] = useState(false);
  const webviewRef = useRef(null);

  useEffect(() => {
    loadPage(currentUrl);
  }, []);

  const loadPage = async (url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would use the webview or fetch API
      // For now, we'll simulate loading with a mock response
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock page content based on URL
      let mockContent = '';
      let mockTitle = '';
      
      if (url.includes('info.cern.ch')) {
        mockTitle = 'CERN - World Wide Web';
        mockContent = `
          <html>
            <head><title>${mockTitle}</title></head>
            <body>
              <h1>World Wide Web</h1>
              <p>The WorldWideWeb (W3) is a wide-area hypermedia information retrieval initiative aiming to give universal access to a large universe of documents.</p>
              <p>Everything there is online about W3 is linked directly or indirectly to this document, including an executive summary of the project, Mailing lists, Policy, November's W3 news, Frequently Asked Questions.</p>
              <h2>What's out there?</h2>
              <p>Pointers to the world's online information, subjects, W3 servers, etc.</p>
              <h2>Help</h2>
              <p>On the browser you are using</p>
              <h2>Software Products</h2>
              <p>A list of W3 project components and their current state. (e.g. Line Mode, X11 Viola, NeXTStep, Servers, Tools, Mail robot, Library)</p>
              <p><a href="https://www.w3.org">More information at W3C</a></p>
            </body>
          </html>
        `;
      } else if (url.includes('w3.org')) {
        mockTitle = 'World Wide Web Consortium (W3C)';
        mockContent = `
          <html>
            <head><title>${mockTitle}</title></head>
            <body>
              <h1>World Wide Web Consortium (W3C)</h1>
              <p>The World Wide Web Consortium (W3C) is an international community where Member organizations, a full-time staff, and the public work together to develop Web standards.</p>
              <h2>Web Standards</h2>
              <p>W3C's primary activity is to develop protocols and guidelines that ensure long-term growth for the Web.</p>
              <ul>
                <li>HTML & CSS</li>
                <li>JavaScript Web APIs</li>
                <li>Web Graphics</li>
                <li>Audio and Video</li>
                <li>Accessibility</li>
                <li>Internationalization</li>
              </ul>
              <p><a href="https://info.cern.ch">Back to CERN</a></p>
            </body>
          </html>
        `;
      } else {
        mockTitle = 'Web Page';
        mockContent = `
          <html>
            <head><title>${mockTitle}</title></head>
            <body>
              <h1>Web Page</h1>
              <p>This is a simulated web page for the URL: ${url}</p>
              <p>In a real implementation, this would load the actual content from the web.</p>
              <p><a href="https://info.cern.ch">Go to CERN</a></p>
            </body>
          </html>
        `;
      }

      setPageContent(mockContent);
      setPageTitle(mockTitle);
      setCurrentUrl(url);
      
      // Update history
      const newHistory = pageHistory.slice(0, historyIndex + 1);
      newHistory.push(url);
      setPageHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
    } catch (error) {
      console.error('Failed to load page:', error);
      setPageContent(`<html><body><h1>Error</h1><p>Failed to load: ${url}</p></body></html>`);
      setPageTitle('Error');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = pageHistory[newIndex];
      setCurrentUrl(url);
      loadPage(url);
    }
  };

  const navigateForward = () => {
    if (historyIndex < pageHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = pageHistory[newIndex];
      setCurrentUrl(url);
      loadPage(url);
    }
  };

  const refresh = () => {
    loadPage(currentUrl);
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    if (url) {
      loadPage(url);
    }
  };

  const addBookmark = () => {
    const newBookmark = {
      id: Date.now(),
      title: pageTitle || currentUrl,
      url: currentUrl
    };
    setBookmarks([...bookmarks, newBookmark]);
  };

  const removeBookmark = (id) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const openBookmark = (url) => {
    loadPage(url);
    setShowBookmarks(false);
  };

  const editPageInEditor = () => {
    if (onPageSelect) {
      // Extract body content from the full HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(pageContent, 'text/html');
      const bodyContent = doc.body.innerHTML;
      onPageSelect(bodyContent);
    }
  };

  return (
    <div className="client-browser">
      <div className="browser-toolbar">
        <div className="navigation-controls">
          <button 
            className="nav-btn"
            onClick={navigateBack}
            disabled={historyIndex <= 0}
            title="Back"
          >
            ←
          </button>
          <button 
            className="nav-btn"
            onClick={navigateForward}
            disabled={historyIndex >= pageHistory.length - 1}
            title="Forward"
          >
            →
          </button>
          <button 
            className="nav-btn"
            onClick={refresh}
            disabled={isLoading}
            title="Refresh"
          >
            ↻
          </button>
        </div>

        <form className="address-bar" onSubmit={handleUrlSubmit}>
          <input
            type="text"
            name="url"
            defaultValue={currentUrl}
            key={currentUrl}
            placeholder="Enter URL..."
          />
          <button type="submit" disabled={isLoading}>Go</button>
        </form>

        <div className="browser-actions">
          <button 
            className="action-btn"
            onClick={() => setShowBookmarks(!showBookmarks)}
            title="Bookmarks"
          >
            ★
          </button>
          <button 
            className="action-btn"
            onClick={addBookmark}
            title="Add Bookmark"
          >
            ⚑
          </button>
          <button 
            className="action-btn"
            onClick={() => setShowPageSource(!showPageSource)}
            title="View Source"
          >
            &lt;/&gt;
          </button>
          <button 
            className="action-btn"
            onClick={editPageInEditor}
            title="Edit in Hypertext Editor"
          >
            ✎
          </button>
        </div>
      </div>

      <div className="browser-content">
        {showBookmarks && (
          <div className="bookmarks-sidebar">
            <h3>Bookmarks</h3>
            <div className="bookmarks-list">
              {bookmarks.map(bookmark => (
                <div key={bookmark.id} className="bookmark-item">
                  <button 
                    className="bookmark-link"
                    onClick={() => openBookmark(bookmark.url)}
                    title={bookmark.url}
                  >
                    {bookmark.title}
                  </button>
                  <button 
                    className="bookmark-remove"
                    onClick={() => removeBookmark(bookmark.id)}
                    title="Remove bookmark"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="page-content">
          {isLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading {currentUrl}...</p>
            </div>
          ) : (
            <>
              {showPageSource ? (
                <div className="page-source">
                  <h3>Page Source</h3>
                  <pre><code>{pageContent}</code></pre>
                </div>
              ) : (
                <div 
                  className="rendered-page"
                  dangerouslySetInnerHTML={{ __html: pageContent }}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="browser-status">
        <span className="page-title">{pageTitle}</span>
        <span className="current-url">{currentUrl}</span>
      </div>
    </div>
  );
};

export default ClientBrowser;
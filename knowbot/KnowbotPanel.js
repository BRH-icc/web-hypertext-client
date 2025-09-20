import React, { useState, useEffect, useRef } from 'react';
import './KnowbotPanel.css';

const KnowbotPanel = ({ onCrawlResults, onPageSelect }) => {
  const [crawlUrl, setCrawlUrl] = useState('https://info.cern.ch');
  const [crawlStatus, setCrawlStatus] = useState('idle'); // idle, crawling, completed, error
  const [crawlProgress, setCrawlProgress] = useState({ visited: 0, total: 0, current: '' });
  const [crawlResults, setCrawlResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [crawlSettings, setCrawlSettings] = useState({
    maxDepth: 3,
    maxPages: 50,
    respectRobots: true,
    delay: 1000,
    followExternalLinks: false,
    includeImages: false,
    includeDocuments: true
  });
  const [indexStats, setIndexStats] = useState({ pages: 0, links: 0, size: '0 KB' });
  const [crawlLog, setCrawlLog] = useState([]);
  const crawlWorkerRef = useRef(null);

  useEffect(() => {
    // Set up knowbot event listeners
    if (window.knowbotAPI) {
      const handleCrawlProgress = (event, progress) => {
        setCrawlProgress(progress);
        setCrawlLog(prev => [...prev, `Crawling: ${progress.current} (${progress.visited}/${progress.total})`]);
      };

      const handleCrawlComplete = (event, results) => {
        setCrawlStatus('completed');
        setCrawlResults(results);
        setIndexStats({
          pages: results.length,
          links: results.reduce((sum, page) => sum + (page.links?.length || 0), 0),
          size: formatBytes(results.reduce((sum, page) => sum + (page.size || 0), 0))
        });
        setCrawlLog(prev => [...prev, `Crawl completed: ${results.length} pages indexed`]);
        if (onCrawlResults) {
          onCrawlResults(results);
        }
      };

      window.knowbotAPI.onCrawlProgress(handleCrawlProgress);
      window.knowbotAPI.onCrawlComplete(handleCrawlComplete);

      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners('knowbot-crawl-progress');
          window.electronAPI.removeAllListeners('knowbot-crawl-complete');
        }
      };
    }
  }, [onCrawlResults]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const startCrawl = async () => {
    if (!crawlUrl) return;

    setCrawlStatus('crawling');
    setCrawlProgress({ visited: 0, total: 1, current: crawlUrl });
    setCrawlResults([]);
    setCrawlLog([`Starting crawl from: ${crawlUrl}`]);

    try {
      // In a real implementation, this would start the actual crawling process
      if (window.knowbotAPI) {
        await window.knowbotAPI.startCrawl(crawlUrl, crawlSettings);
      } else {
        // Mock crawling for demonstration
        await mockCrawl();
      }
    } catch (error) {
      console.error('Crawl failed:', error);
      setCrawlStatus('error');
      setCrawlLog(prev => [...prev, `Error: ${error.message}`]);
    }
  };

  const mockCrawl = async () => {
    // Simulate crawling process
    const mockPages = [
      {
        url: 'https://info.cern.ch',
        title: 'CERN - World Wide Web',
        content: 'The WorldWideWeb (W3) is a wide-area hypermedia information retrieval initiative...',
        links: ['https://www.w3.org', 'https://info.cern.ch/hypertext/WWW/TheProject.html'],
        depth: 0,
        size: 2048,
        timestamp: new Date().toISOString()
      },
      {
        url: 'https://www.w3.org',
        title: 'World Wide Web Consortium (W3C)',
        content: 'The World Wide Web Consortium (W3C) is an international community...',
        links: ['https://www.w3.org/TR/', 'https://www.w3.org/standards/'],
        depth: 1,
        size: 3072,
        timestamp: new Date().toISOString()
      },
      {
        url: 'https://info.cern.ch/hypertext/WWW/TheProject.html',
        title: 'The World Wide Web project',
        content: 'The WorldWideWeb project is to allow universal access to large sets of information...',
        links: ['https://info.cern.ch/hypertext/WWW/Summary.html'],
        depth: 1,
        size: 1536,
        timestamp: new Date().toISOString()
      }
    ];

    for (let i = 0; i < mockPages.length; i++) {
      setCrawlProgress({ visited: i, total: mockPages.length, current: mockPages[i].url });
      setCrawlLog(prev => [...prev, `Crawling: ${mockPages[i].url}`]);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    }

    setCrawlStatus('completed');
    setCrawlResults(mockPages);
    setIndexStats({
      pages: mockPages.length,
      links: mockPages.reduce((sum, page) => sum + page.links.length, 0),
      size: formatBytes(mockPages.reduce((sum, page) => sum + page.size, 0))
    });
    setCrawlLog(prev => [...prev, `Crawl completed: ${mockPages.length} pages indexed`]);
    
    if (onCrawlResults) {
      onCrawlResults(mockPages);
    }
  };

  const stopCrawl = async () => {
    if (window.knowbotAPI) {
      await window.knowbotAPI.stopCrawl();
    }
    setCrawlStatus('idle');
    setCrawlLog(prev => [...prev, 'Crawl stopped by user']);
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      let results;
      if (window.knowbotAPI) {
        results = await window.knowbotAPI.search(searchQuery, { limit: 50 });
      } else {
        // Mock search
        results = crawlResults.filter(page => 
          page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setSearchResults(results);
      setCrawlLog(prev => [...prev, `Search for "${searchQuery}": ${results.length} results`]);
    } catch (error) {
      console.error('Search failed:', error);
      setCrawlLog(prev => [...prev, `Search error: ${error.message}`]);
    }
  };

  const clearIndex = async () => {
    try {
      if (window.knowbotAPI) {
        await window.knowbotAPI.clearIndex();
      }
      setCrawlResults([]);
      setSearchResults([]);
      setIndexStats({ pages: 0, links: 0, size: '0 KB' });
      setCrawlLog(prev => [...prev, 'Index cleared']);
    } catch (error) {
      console.error('Failed to clear index:', error);
    }
  };

  const analyzePage = async (url) => {
    try {
      if (window.knowbotAPI) {
        const analysis = await window.knowbotAPI.analyzePage(url);
        setSelectedResult(analysis);
        setCrawlLog(prev => [...prev, `Analyzed: ${url}`]);
      }
    } catch (error) {
      console.error('Page analysis failed:', error);
    }
  };

  const openInEditor = (page) => {
    if (onPageSelect && page) {
      onPageSelect(page.url, page.content);
    }
  };

  return (
    <div className="knowbot-panel">
      <div className="knowbot-header">
        <h2>🤖 Knowbot - Intelligent Web Crawler</h2>
        <div className="index-stats">
          <span>📄 {indexStats.pages} pages</span>
          <span>🔗 {indexStats.links} links</span>
          <span>💾 {indexStats.size}</span>
        </div>
      </div>

      <div className="knowbot-content">
        <div className="knowbot-controls">
          {/* Crawl Controls */}
          <div className="control-section">
            <h3>Web Crawler</h3>
            <div className="crawl-input">
              <input
                type="url"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                placeholder="Enter starting URL..."
                disabled={crawlStatus === 'crawling'}
              />
              {crawlStatus === 'crawling' ? (
                <button onClick={stopCrawl} className="stop-btn">Stop</button>
              ) : (
                <button onClick={startCrawl} className="start-btn">Start Crawl</button>
              )}
            </div>

            {crawlStatus === 'crawling' && (
              <div className="crawl-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(crawlProgress.visited / crawlProgress.total) * 100}%` }}
                  />
                </div>
                <span className="progress-text">
                  {crawlProgress.visited}/{crawlProgress.total} pages
                </span>
                <div className="current-page">
                  Currently crawling: {crawlProgress.current}
                </div>
              </div>
            )}

            {/* Crawl Settings */}
            <details className="crawl-settings">
              <summary>Crawl Settings</summary>
              <div className="settings-grid">
                <label>
                  Max Depth:
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={crawlSettings.maxDepth}
                    onChange={(e) => setCrawlSettings(prev => ({
                      ...prev,
                      maxDepth: parseInt(e.target.value)
                    }))}
                  />
                </label>
                <label>
                  Max Pages:
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={crawlSettings.maxPages}
                    onChange={(e) => setCrawlSettings(prev => ({
                      ...prev,
                      maxPages: parseInt(e.target.value)
                    }))}
                  />
                </label>
                <label>
                  Delay (ms):
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={crawlSettings.delay}
                    onChange={(e) => setCrawlSettings(prev => ({
                      ...prev,
                      delay: parseInt(e.target.value)
                    }))}
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={crawlSettings.respectRobots}
                    onChange={(e) => setCrawlSettings(prev => ({
                      ...prev,
                      respectRobots: e.target.checked
                    }))}
                  />
                  Respect robots.txt
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={crawlSettings.followExternalLinks}
                    onChange={(e) => setCrawlSettings(prev => ({
                      ...prev,
                      followExternalLinks: e.target.checked
                    }))}
                  />
                  Follow external links
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={crawlSettings.includeDocuments}
                    onChange={(e) => setCrawlSettings(prev => ({
                      ...prev,
                      includeDocuments: e.target.checked
                    }))}
                  />
                  Include documents (PDF, DOC)
                </label>
              </div>
            </details>
          </div>

          {/* Search Controls */}
          <div className="control-section">
            <h3>Search Index</h3>
            <div className="search-input">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crawled content..."
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              />
              <button onClick={performSearch} className="search-btn">Search</button>
            </div>
            <button onClick={clearIndex} className="clear-btn">Clear Index</button>
          </div>
        </div>

        <div className="knowbot-results">
          <div className="results-section">
            <h3>
              {searchQuery ? `Search Results (${searchResults.length})` : `Crawled Pages (${crawlResults.length})`}
            </h3>
            <div className="results-list">
              {(searchQuery ? searchResults : crawlResults).map((page, index) => (
                <div key={index} className="result-item">
                  <div className="result-header">
                    <h4 className="result-title">{page.title}</h4>
                    <div className="result-actions">
                      <button
                        onClick={() => analyzePage(page.url)}
                        className="analyze-btn"
                        title="Analyze Page"
                      >
                        🔍
                      </button>
                      <button
                        onClick={() => openInEditor(page)}
                        className="edit-btn"
                        title="Open in Editor"
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                  <div className="result-url">{page.url}</div>
                  <div className="result-content">
                    {page.content?.substring(0, 200)}...
                  </div>
                  <div className="result-meta">
                    <span>Depth: {page.depth}</span>
                    <span>Links: {page.links?.length || 0}</span>
                    <span>Size: {formatBytes(page.size || 0)}</span>
                    {page.timestamp && (
                      <span>Crawled: {new Date(page.timestamp).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="log-section">
            <h3>Crawl Log</h3>
            <div className="crawl-log">
              {crawlLog.map((entry, index) => (
                <div key={index} className="log-entry">
                  <span className="log-time">
                    {new Date().toLocaleTimeString()}
                  </span>
                  <span className="log-message">{entry}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowbotPanel;
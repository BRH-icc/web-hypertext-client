import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Hide loading screen
const loadingScreen = document.getElementById('loadingScreen');
if (loadingScreen) {
  loadingScreen.style.display = 'none';
}

// Create React root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
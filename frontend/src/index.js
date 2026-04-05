import React from 'react';
import ReactDOM from 'react-dom/client';
// Remove root CSS files from src and use styles/
import './styles/index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

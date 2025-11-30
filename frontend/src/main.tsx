import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
  // Temporarily disabled StrictMode to prevent double-rendering issues
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>,
);



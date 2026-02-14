import React from 'react';
import ReactDOM from 'react-dom/client';
import RecipeApp from './recipe_keeper_app.tsx';
import ErrorBoundary from './ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <RecipeApp />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Error: Root element not found!</h1></div>';
}

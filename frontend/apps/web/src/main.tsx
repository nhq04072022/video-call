import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

async function enableMocking() {
  // Disable MSW if backend services are available
  // Check if we should use mocks (only if backend is not running)
  if (import.meta.env.MODE !== 'development') {
    return;
  }

  // Optionally disable MSW if backend is running
  // Set VITE_DISABLE_MSW=true to disable mocking
  if (import.meta.env.VITE_DISABLE_MSW === 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    // Temporarily disable StrictMode to avoid double mount issues with LiveKit
    // TODO: Re-enable StrictMode once LiveKit connection is stable
    <App />
    // <React.StrictMode>
    //   <App />
    // </React.StrictMode>
  );
});






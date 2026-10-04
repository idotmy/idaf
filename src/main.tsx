import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence console outputs in production to keep user terminal clean
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.warn = noop;
  console.error = noop;
}

createRoot(document.getElementById('root')!).render(<App />);

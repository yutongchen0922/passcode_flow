import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { devFlags } from './devFlags';
import './styles/tokens.css';
import './styles/global.css';

if (devFlags.still) document.documentElement.dataset.still = '';
if (devFlags.slowmo) document.documentElement.dataset.slowmo = '';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { MOTION_SCALE } from './passcode/config';
import './styles/tokens.css';
import './styles/global.css';

// Review switches: `?still` turns motion off (pixel-diff), `?slowmo` plays it at 1/5 speed.
const params = new URLSearchParams(window.location.search);
if (params.has('still')) document.documentElement.dataset.still = '';
if (MOTION_SCALE > 1) document.documentElement.dataset.slowmo = '';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

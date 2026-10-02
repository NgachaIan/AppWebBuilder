import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { ConfirmProvider } from './lib/confirm';
import { DEMO } from './lib/api';

const Router = DEMO ? MemoryRouter : BrowserRouter;
import './index.css';
import { ToastProvider } from './lib/toast';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/builder/:id" element={<Builder />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Router>
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
);

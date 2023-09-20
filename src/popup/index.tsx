import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './Popup';
import '@/globals.css';
import { TooltipProvider } from '@radix-ui/react-tooltip';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
   <React.StrictMode>
      <TooltipProvider>
         <App />
      </TooltipProvider>
   </React.StrictMode>,
);

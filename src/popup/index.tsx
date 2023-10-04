import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './Popup';
import '@/globals.css';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
export const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
   <React.StrictMode>
      <TooltipProvider>
         <QueryClientProvider client={queryClient}>
            <App />
         </QueryClientProvider>
      </TooltipProvider>
   </React.StrictMode>,
);

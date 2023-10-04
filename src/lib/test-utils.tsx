/* eslint-disable import/export */
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/popup';
import { QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
   cleanup();
});

function customRender(ui: React.ReactElement, options = {}) {
   return render(ui, {
      wrapper: ({ children }) => (
         <TooltipProvider>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
         </TooltipProvider>
      ),
      ...options,
   });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };

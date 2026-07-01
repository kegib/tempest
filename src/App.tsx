import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';
import { AppProvider } from '@/components/AppProvider';
import { AppConfig } from '@/contexts/AppContext';
import AppRouter from './AppRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

const defaultConfig: AppConfig = {
  theme: 'dark',
};

export function App() {
  return (
    <AppProvider storageKey="tmpst:config" defaultConfig={defaultConfig}>
      <QueryClientProvider client={queryClient}>
        <Suspense>
          <AppRouter />
        </Suspense>
      </QueryClientProvider>
    </AppProvider>
  );
}

export default App;

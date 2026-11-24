import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import './styles.css';
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10000 } },
});
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#146b4a',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      }}
    >
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
);

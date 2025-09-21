import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// RainbowKit and Wagmi imports
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains'; // Using Polygon Amoy for testing
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/ui/ThemeProvider.tsx";


// 1. Configure your chains and generate the Wagmi config
const config = getDefaultConfig({
  appName: 'Blue Ledger',
  projectId: '28b292170e8228e4a91e88cb34b0ae63', // Your WalletConnect Project ID
  chains: [polygonAmoy],
  ssr: false, // Not using server-side rendering
});

const queryClient = new QueryClient();

// 2. Render the app, wrapping it with all the providers
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <App />
          </ThemeProvider>
          
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

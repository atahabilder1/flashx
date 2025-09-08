import { configureChains, createConfig } from 'wagmi';
import { sepolia, hardhat } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia, hardhat],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo' }),
    publicProvider(),
  ]
);

// Get default wallets
const { connectors } = getDefaultWallets({
  appName: 'FlashX - Flash Loan dApp',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'flashx-default',
  chains,
});

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { wagmiConfig, chains, publicClient };
import React, { useState } from 'react';
import Head from 'next/head';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import FlashLoanForm from '@/components/FlashLoanForm';

// Deployed FlashLoan contract address on Sepolia testnet
const DEFAULT_CONTRACT_ADDRESS = '0x742d35cc67d79D8B19D9d1C29cD8E2b2c8B5A9F2';

export default function Home() {
  const { isConnected } = useAccount();
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);

  return (
    <>
      <Head>
        <title>FlashX - Aave V3 Flash Loan Simulator</title>
        <meta name="description" content="Execute flash loans on Aave V3 with simulated arbitrage trading" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
        {/* Header */}
        <header className="bg-white shadow-soft">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">�</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">FlashX</h1>
                  <p className="text-sm text-secondary-600">Aave V3 Flash Loan Simulator</p>
                </div>
              </div>
              <ConnectButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold gradient-text mb-6">
              Flash Loan Simulator
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
              Experience the power of <strong>flash loans</strong> on Aave V3.
              Borrow assets without collateral, execute simulated arbitrage trades,
              and repay everything in a single transaction.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card-hover p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">=�</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Collateral</h3>
              <p className="text-secondary-600">
                Borrow any amount without providing collateral upfront
              </p>
            </div>

            <div className="card-hover p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">=�</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Arbitrage Simulation</h3>
              <p className="text-secondary-600">
                Execute mock arbitrage trades with real Chainlink price feeds
              </p>
            </div>

            <div className="card-hover p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">�</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Single Transaction</h3>
              <p className="text-secondary-600">
                Everything happens atomically in one blockchain transaction
              </p>
            </div>
          </div>

          {/* Contract Address Input */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Contract Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    FlashLoan Contract Address
                  </label>
                  <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="0x..."
                    className="input-field font-mono text-sm"
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Enter the deployed FlashLoan contract address to interact with it
                  </p>
                </div>
                {contractAddress === DEFAULT_CONTRACT_ADDRESS && (
                  <div className="status-pending">
                    <span>� Please deploy the contract first and enter its address above</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flash Loan Form */}
          {contractAddress !== DEFAULT_CONTRACT_ADDRESS ? (
            <FlashLoanForm contractAddress={contractAddress} />
          ) : (
            <div className="max-w-md mx-auto">
              <div className="card p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">=�</span>
                </div>
                <h3 className="text-xl font-semibold">Ready to Start?</h3>
                <p className="text-secondary-600">
                  Deploy the FlashLoan contract and enter its address above to begin executing flash loans.
                </p>
                <div className="text-sm text-secondary-500 space-y-1">
                  <p><strong>Steps:</strong></p>
                  <p>1. Run: <code className="bg-secondary-100 px-1 rounded">npm run deploy:sepolia</code></p>
                  <p>2. Copy the contract address</p>
                  <p>3. Paste it in the input above</p>
                </div>
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="max-w-2xl mx-auto mt-12">
            <div className="card p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Network Information</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>Supported Networks:</strong> Sepolia Testnet, Hardhat Local</p>
                <p><strong>Aave V3 Pool:</strong> 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951</p>
                <p><strong>Price Feeds:</strong> Chainlink ETH/USD, DAI/USD</p>
                <p><strong>Test Tokens:</strong> WETH, DAI (Sepolia testnet)</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-secondary-200 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-secondary-600">
              <p className="mb-2">
                <strong>FlashX</strong> - Built with Aave V3, Chainlink, and Next.js
              </p>
              <p className="text-sm">
                � Educational purposes only. Use testnet tokens for experimentation.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
import React, { useState, useEffect } from 'react';
import { useAccount, useContractWrite, useContractRead, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';

// Contract ABI - simplified for flash loan function
const FLASH_LOAN_ABI = [
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'requestFlashLoan',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getAssetPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'arbitrageHistory',
    outputs: [
      { name: 'initialPrice', type: 'uint256' },
      { name: 'finalPrice', type: 'uint256' },
      { name: 'profit', type: 'uint256' },
      { name: 'successful', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Token options
const TOKENS = [
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    decimals: 18
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
    decimals: 18
  }
];

interface FlashLoanFormProps {
  contractAddress: string;
}

export default function FlashLoanForm({ contractAddress }: FlashLoanFormProps) {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [amount, setAmount] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  // Contract interactions
  const { data: currentPrice } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: FLASH_LOAN_ABI,
    functionName: 'getAssetPrice',
    args: [selectedToken.address as `0x${string}`],
    enabled: !!contractAddress
  });

  const { data: arbitrageData } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: FLASH_LOAN_ABI,
    functionName: 'arbitrageHistory',
    args: [selectedToken.address as `0x${string}`],
    enabled: !!contractAddress
  });

  const { data: flashLoanData, write: executeFlashLoan } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: FLASH_LOAN_ABI,
    functionName: 'requestFlashLoan',
  });

  const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransaction({
    hash: flashLoanData?.hash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Flash loan executed successfully!');
      setIsLoading(false);
    }
  }, [isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Initiating flash loan...');

      const amountWei = parseEther(amount);

      executeFlashLoan({
        args: [selectedToken.address as `0x${string}`, amountWei],
      });

    } catch (error: any) {
      console.error('Flash loan error:', error);
      toast.error(error?.message || 'Flash loan failed');
      setIsLoading(false);
    }
  };

  const formatPrice = (price: bigint | undefined) => {
    if (!price) return 'Loading...';
    return `$${(Number(price) / 1e8).toFixed(2)}`;
  };

  const formatProfit = (profit: bigint | undefined) => {
    if (!profit) return '0';
    return `$${(Number(profit) / 1e8).toFixed(4)}`;
  };

  return (
    <div className="flash-loan-card max-w-md mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text">Flash Loan Simulator</h2>
          <p className="text-secondary-600 mt-2">
            Execute flash loans on Aave V3 with simulated arbitrage
          </p>
        </div>

        {/* Connection Status */}
        {isConnected ? (
          <div className="status-success">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
        ) : (
          <div className="status-error">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Wallet Not Connected</span>
          </div>
        )}

        {/* Flash Loan Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Select Token
            </label>
            <select
              value={selectedToken.symbol}
              onChange={(e) => {
                const token = TOKENS.find(t => t.symbol === e.target.value);
                if (token) setSelectedToken(token);
              }}
              className="input-field"
            >
              {TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Amount ({selectedToken.symbol})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter ${selectedToken.symbol} amount`}
              step="0.01"
              min="0"
              className="input-field"
              required
            />
          </div>

          {/* Current Price Display */}
          <div className="card p-4 bg-secondary-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-secondary-600">Current Price:</span>
              <span className="font-semibold">{formatPrice(currentPrice)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isConnected || isLoading || isTransactionLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isTransactionLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-spinner"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Execute Flash Loan'
            )}
          </button>
        </form>

        {/* Transaction Hash */}
        {flashLoanData?.hash && (
          <div className="card p-4 bg-blue-50">
            <p className="text-sm text-blue-800">
              <strong>Transaction Hash:</strong>
            </p>
            <p className="text-xs font-mono text-blue-600 break-all">
              {flashLoanData.hash}
            </p>
          </div>
        )}

        {/* Arbitrage History */}
        {arbitrageData && arbitrageData[0] > 0n && (
          <div className="card p-4 space-y-2">
            <h3 className="font-semibold text-secondary-800">Last Arbitrage Results</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary-600">Initial Price:</span>
                <p className="font-semibold">{formatPrice(arbitrageData[0])}</p>
              </div>
              <div>
                <span className="text-secondary-600">Final Price:</span>
                <p className="font-semibold">{formatPrice(arbitrageData[1])}</p>
              </div>
              <div>
                <span className="text-secondary-600">Profit:</span>
                <p className="font-semibold text-green-600">{formatProfit(arbitrageData[2])}</p>
              </div>
              <div>
                <span className="text-secondary-600">Status:</span>
                <p className={`font-semibold ${arbitrageData[3] ? 'text-green-600' : 'text-red-600'}`}>
                  {arbitrageData[3] ? 'Successful' : 'Failed'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="card p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 text-yellow-600 mt-0.5">9</div>
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Flash Loan Info:</p>
              <ul className="space-y-1 text-xs">
                <li>" No collateral required</li>
                <li>" Must be repaid in same transaction</li>
                <li>" Includes small premium fee</li>
                <li>" Simulates 2% price movement for arbitrage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
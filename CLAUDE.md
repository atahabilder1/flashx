# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlashX is a full-stack decentralized application demonstrating Aave V3 flash loans with Chainlink price feed integration. It consists of:
- **Smart Contracts**: Solidity contracts implementing flash loan logic with arbitrage simulation
- **Backend**: Hardhat development environment with TypeScript
- **Frontend**: Next.js application with RainbowKit wallet integration

## Development Commands

### Backend (Smart Contracts)

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Run tests with gas reporting
REPORT_GAS=true npm run test

# Deploy to local network
npm run node                    # Terminal 1 - starts local Hardhat node
npm run deploy                  # Terminal 2 - deploys to local network

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Simulate flash loan execution
npm run simulate

# Clean build artifacts
npm run clean

# Type checking
npm run typecheck
```

### Frontend

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

## Architecture

### Smart Contract Architecture

The core contract is `contracts/FlashLoan.sol` which:
1. Implements `IFlashLoanSimpleReceiver` interface for Aave V3 integration
2. Inherits from OpenZeppelin's `ReentrancyGuard` and `Ownable` for security
3. Integrates with Chainlink price feeds for ETH/USD and DAI/USD prices
4. Simulates arbitrage by calculating 2% price movement scenarios

**Key contract addresses (Sepolia testnet):**
- Aave V3 Pool: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`
- Aave Addresses Provider: `0x0496275d34753A48320CA58103d5220d394FF77F`
- ETH/USD Price Feed: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- DAI/USD Price Feed: `0x14866185B1962B63C3Ea9E03Bc1da838bab34C19`
- WETH Token: `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`
- DAI Token: `0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357`

**Flash loan execution flow:**
1. User calls `requestFlashLoan(asset, amount)` (owner-only)
2. Contract requests flash loan from Aave V3 Pool
3. Aave transfers tokens and calls `executeOperation()` callback
4. Contract simulates arbitrage using Chainlink price feeds
5. Contract approves and repays loan amount + premium (0.05%)
6. Events are emitted with arbitrage simulation results

**Important contract methods:**
- `requestFlashLoan(address asset, uint256 amount)`: Initiates flash loan (owner only)
- `executeOperation(...)`: Aave callback that executes during flash loan
- `simulateArbitrage(address asset, uint256 amount)`: Internal arbitrage simulation
- `getAssetPrice(address asset)`: Fetches current price from Chainlink oracles
- `withdrawAsset(address asset, uint256 amount)`: Withdraw tokens from contract (owner only)

### Frontend Architecture

Built with Next.js 13 using the Pages Router:
- `frontend/pages/_app.tsx`: Application wrapper with RainbowKit, wagmi, and React Query providers
- `frontend/pages/index.tsx`: Main landing page with flash loan interface
- `frontend/components/FlashLoanForm.tsx`: Core component for flash loan interaction
- `frontend/utils/wagmi.ts`: Blockchain configuration for wagmi

**State management approach:**
- Uses wagmi hooks (`useContractRead`, `useContractWrite`) for blockchain interactions
- React Query for caching contract reads
- RainbowKit for wallet connection management

### Project Structure

```
flashx/
├── contracts/              # Solidity smart contracts
│   ├── FlashLoan.sol      # Main flash loan contract
│   └── interfaces/        # Contract interfaces (Aave, Chainlink, ERC20)
├── scripts/               # Deployment and interaction scripts
│   ├── deploy.ts          # Deployment script with Etherscan verification
│   └── simulateFlashLoan.ts  # Script to execute flash loan on deployed contract
├── test/                  # Comprehensive test suite
│   └── FlashLoan.test.ts  # Contract tests (deployment, access control, price feeds, etc.)
├── utils/                 # Utility functions
│   └── verify.ts          # Etherscan verification helper
├── frontend/              # Next.js frontend application
│   ├── pages/            # Next.js pages
│   ├── components/       # React components
│   ├── utils/            # Frontend utilities (wagmi config)
│   └── styles/           # Global styles with TailwindCSS
├── deployments/          # Auto-generated deployment artifacts (gitignored)
├── typechain-types/      # Auto-generated TypeScript types for contracts
└── hardhat.config.ts     # Hardhat configuration
```

## Development Workflow

### Testing Smart Contracts

The test suite in `test/FlashLoan.test.ts` covers:
- Contract deployment and initialization
- Access control (owner-only functions)
- Price feed integration (Chainlink oracles)
- Flash loan execution and validation
- Arbitrage simulation logic
- Event emission
- Security features (ReentrancyGuard)
- Edge cases and error handling

**Key testing patterns:**
- Uses `loadFixture` for efficient test setup
- Impersonates Aave Pool address for testing callbacks
- Uses Hardhat forking to test against Sepolia testnet state

### Deployment Process

1. **Local deployment**: Run `npm run node` then `npm run deploy` to deploy to local Hardhat network
2. **Sepolia deployment**: Configure `.env` file, then run `npm run deploy:sepolia`
3. **Contract verification**: Automatic Etherscan verification after deployment (if API key configured)
4. **Deployment artifacts**: Saved to `deployments/{network}.json` with contract address and metadata

**Important**: The `simulateFlashLoan.ts` script reads deployment info from `deployments/{network}.json`, so ensure contracts are deployed before running simulations.

### Environment Configuration

Copy `.env.example` to `.env` and configure:
- `SEPOLIA_RPC_URL`: Alchemy or Infura RPC URL for Sepolia
- `PRIVATE_KEY`: Deployer private key (without 0x prefix)
- `ETHERSCAN_API_KEY`: For contract verification
- `ALCHEMY_API_KEY`: For frontend RPC access
- `REPORT_GAS`: Set to "true" for gas reporting in tests

## Code Style and Patterns

### Smart Contract Patterns

1. **Security first**: All state-changing functions protected with `onlyOwner` or validated sender checks
2. **Events for transparency**: Emit events for all significant state changes (`FlashLoanExecuted`, `ArbitrageSimulated`)
3. **Oracle validation**: Price feed data includes staleness checks (must be updated within 1 hour)
4. **Input validation**: All parameters validated before use (non-zero amounts, valid addresses)

### TypeScript Patterns

1. **Type safety**: Use TypeChain-generated types for contract interactions
2. **Error handling**: Comprehensive try-catch blocks with user-friendly error messages
3. **Async/await**: Consistent use of async/await for blockchain operations
4. **Event listeners**: Set up event listeners before transactions for real-time updates

### Frontend Patterns

1. **Wallet-first**: Check wallet connection before showing contract interactions
2. **Loading states**: Display pending states during transactions
3. **Error feedback**: Toast notifications for transaction success/failure
4. **Responsive design**: Mobile-first approach with TailwindCSS utilities

## Important Notes

### Network-Specific Behavior

- **Hardhat forking**: Local tests fork Sepolia to access real Aave/Chainlink contracts
- **Gas limits**: Flash loan transactions require ~500,000 gas limit
- **Testnet only**: Contract is configured for Sepolia testnet (addresses hardcoded)

### Common Gotchas

1. **Contract ownership**: Only contract owner can call `requestFlashLoan()` and `withdrawAsset()`
2. **Insufficient balance**: Contract must have enough tokens to repay flash loan + premium
3. **Price feed staleness**: Chainlink price data older than 1 hour will revert
4. **Hardcoded addresses**: Token addresses in `FlashLoan.sol:127-138` are Sepolia-specific

### Security Considerations

- **Educational purpose**: This is a demonstration project, not production-ready
- **No real arbitrage**: Arbitrage is simulated, not executed on real DEXes
- **Access control**: Critical functions restricted to contract owner
- **Reentrancy protection**: Uses OpenZeppelin's ReentrancyGuard
- **Oracle security**: Validates Chainlink responses for staleness and validity

## Extending the Project

### Adding New Token Support

1. Add Chainlink price feed address to constructor in `FlashLoan.sol`
2. Update `getAssetPrice()` function with new token case
3. Add token address to `.env.example` and documentation
4. Update frontend token selection UI

### Implementing Real Arbitrage

Current arbitrage is simulated. For real arbitrage:
1. Integrate with DEX router (Uniswap, SushiSwap)
2. Calculate actual price differences between exchanges
3. Execute swap logic in `executeOperation()` instead of simulation
4. Handle slippage and MEV protection
5. Add profit validation before repaying flash loan

### Multi-Chain Deployment

To deploy on other networks:
1. Update hardcoded addresses in `FlashLoan.sol` for target network
2. Add network configuration to `hardhat.config.ts`
3. Configure RPC URL and API keys in `.env`
4. Update frontend wagmi config in `frontend/utils/wagmi.ts`
5. Ensure Aave V3 and Chainlink are available on target network

## Useful Resources

- **Aave V3 Documentation**: https://docs.aave.com/developers/
- **Chainlink Price Feeds**: https://docs.chain.link/data-feeds/price-feeds/
- **Hardhat Documentation**: https://hardhat.org/getting-started/
- **RainbowKit Docs**: https://www.rainbowkit.com/docs/introduction
- **Etherscan Sepolia**: https://sepolia.etherscan.io/

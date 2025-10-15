# FlashX

> A full-stack dApp demonstrating flash loan mechanics on Aave V3 with simulated arbitrage execution and Chainlink price feeds.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-blue.svg)](https://solidity.readthedocs.io/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.17.2-yellow.svg)](https://hardhat.org/)

---

## Overview

FlashX lets you experiment with flash loans on Ethereum's Sepolia testnet. It's built to help understand how uncollateralized loans work in DeFi - borrow funds, execute logic, and repay everything in a single atomic transaction.

**Key Integrations:**
- **Aave V3** - Flash loan functionality
- **Chainlink Oracles** - Real-time price feeds (ETH/USD, DAI/USD)
- **Simulated Arbitrage** - Demonstrates profitable trade scenarios

The frontend provides a simple interface to trigger flash loans and view results.

---

### Smart Contracts
- Solidity `^0.8.24`
- OpenZeppelin Contracts (security + access control)
- Hardhat (development and testing)

### Frontend
- Next.js 13 + TypeScript
- RainbowKit + wagmi (wallet connections)
- TailwindCSS (styling)

---

## How Flash Loans Work

Traditional loans require collateral. Flash loans don't - but there's a catch: **you must borrow, use, and repay the funds within the same transaction**. If you can't repay (loan + 0.05% fee), the entire transaction reverts.

### Use Cases
- **Arbitrage** - Exploit price differences across DEXes
- **Collateral Swapping** - Change collateral types without additional capital
- **Liquidations** - Liquidate undercollateralized positions profitably
- **Refinancing** - Self-repaying loan refinancing

---

## Project Structure

```
flashx/
│
├── contracts/
│   ├── FlashLoan.sol              # Main flash loan contract
│   └── interfaces/                # External contract interfaces
│
├── scripts/
│   ├── deploy.ts                  # Deployment script
│   └── simulateFlashLoan.ts       # Flash loan execution test
│
├── test/
│   └── FlashLoan.test.ts          # Comprehensive test suite
│
├── frontend/
│   ├── pages/                     # Next.js pages
│   ├── components/                # React components
│   └── utils/                     # Frontend utilities
│
└── hardhat.config.ts              # Hardhat configuration
```

---

## Getting Started

### Prerequisites

| Requirement | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 16.0 | Runtime environment |
| MetaMask | Latest | Wallet connection |
| Sepolia ETH | Testnet | Gas fees ([Get from faucet](https://sepoliafaucet.com)) |

### Installation

**1. Clone and Install Dependencies**

```bash
git clone https://github.com/yourusername/flashx.git
cd flashx
npm install
```

**2. Configure Environment**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**3. Compile and Test**

```bash
# Compile smart contracts
npx hardhat compile

# Run test suite
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

**4. Launch Frontend**

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` and connect your wallet.

---

## Usage

### Quick Start Guide

**Step 1: Deploy Contract**  
Use the deployment script or connect to an existing Sepolia deployment

**Step 2: Connect Wallet**  
Switch to Sepolia testnet in MetaMask

**Step 3: Configure Contract**  
Paste your deployed contract address in the frontend

**Step 4: Execute Flash Loan**
- Select token (WETH or DAI)
- Enter loan amount
- Click "Execute Flash Loan"
- Confirm transaction in MetaMask

### What Happens Behind the Scenes

```
1. Contract borrows specified amount from Aave V3
2. Simulates 2% arbitrage profit
3. Calculates profit from price difference
4. Repays loan + 0.05% premium
5. Emits events with execution details
```

---

## Contract Addresses (Sepolia Testnet)

### Aave V3 Protocol
```
Pool:             0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
AddressProvider:  0x0496275d34753A48320CA58103d5220d394FF77F
```

### Chainlink Price Feeds
```
ETH/USD:  0x694AA1769357215DE4FAC081bf1f309aDC325306
DAI/USD:  0x14866185B1962B63C3Ea9E03Bc1da838bab34C19
```

### Test Tokens
```
WETH:  0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
DAI:   0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357
```

---

## Smart Contract API

### Core Functions

```solidity
// Request a flash loan (owner only)
function requestFlashLoan(address asset, uint256 amount) 
    external 
    onlyOwner

// Aave callback - handles flash loan execution
function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata params
) external override returns (bool)

// Get current asset price from Chainlink
function getAssetPrice(address asset) 
    public 
    view 
    returns (uint256)

// View historical arbitrage data
function arbitrageHistory(address asset) 
    public 
    view 
    returns (ArbitrageData)
```

---

## Testing

### Run Tests

```bash
# Full test suite
npx hardhat test

# With gas reporting
REPORT_GAS=true npx hardhat test

# Generate coverage report
npx hardhat coverage
```

### Test Coverage

- ✅ Flash loan request and execution flow
- ✅ Arbitrage simulation logic
- ✅ Chainlink price feed integration
- ✅ Access control and permissions
- ✅ Edge cases and error handling
- ✅ Event emission validation

---

## Security Considerations

> ⚠️ **Educational Project** - This is a learning tool. While it follows security best practices, it hasn't been professionally audited. **Use only on testnets.**

### Implemented Security Features

| Feature | Implementation |
|---------|---------------|
| **Reentrancy Protection** | OpenZeppelin's `ReentrancyGuard` |
| **Access Control** | `Ownable` pattern for privileged functions |
| **Price Validation** | Staleness checks on Chainlink feeds |
| **Error Handling** | Comprehensive require statements |

### Production Requirements

For real-world deployment, you'd need:

- [ ] Professional security audit by reputable firm
- [ ] Additional input validation and sanitization
- [ ] Rate limiting mechanisms
- [ ] Enhanced error recovery
- [ ] Real arbitrage logic with DEX integration
- [ ] Circuit breakers and emergency stops
- [ ] Monitoring and alerting infrastructure

---

## Arbitrage Simulation

### How It Works

The contract doesn't execute real trades. Instead, it demonstrates the concept:

```
Step 1: Fetch current price from Chainlink oracle
Step 2: Simulate 2% price increase (profitable scenario)
Step 3: Calculate theoretical profit from price difference
Step 4: Store simulation results in arbitrageHistory mapping
```

### Real-World Implementation

In production, you'd replace simulation with:
- Actual DEX integrations (Uniswap V3, SushiSwap, Curve)
- Multi-hop trade routing
- Slippage protection
- Gas optimization
- MEV protection strategies

---

## Roadmap

### Planned Improvements

**Protocol Enhancements**
- Multi-token flash loans in single transaction
- Real DEX integration (Uniswap V3, SushiSwap)
- Gas optimizations and batching

**Multi-Chain Support**
- Polygon integration
- Arbitrum deployment
- Optimism support

**Advanced Features**
- Sophisticated arbitrage strategies
- Automated opportunity detection
- Enhanced UX and error messaging

---

## Contributing

Contributions are welcome! Here's how you can help:

### Ways to Contribute
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repo if you find it useful

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## Resources & Documentation

### Official Documentation
- [Aave V3 Flash Loans Guide](https://docs.aave.com/developers/guides/flash-loans)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds)
- [EIP-3156: Flash Loan Standard](https://eips.ethereum.org/EIPS/eip-3156)

### Learning Resources
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethereum Development](https://ethereum.org/en/developers/)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built as a learning project to explore flash loan mechanics and DeFi composability.

**Questions or issues?** Open an issue or reach out!

---

<p align="center">Made with ❤️ for the DeFi community</p>
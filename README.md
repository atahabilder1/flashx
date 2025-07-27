# ⚡ FlashX — Aave V3 Flash Loan Simulator

A **full-stack decentralized application (dApp)** that demonstrates **flash loans on Aave V3**.  
Users can borrow assets, simulate a mock arbitrage trade, and repay within a **single transaction** — showcasing **DeFi composability, capital efficiency, and risk considerations**.  

This project integrates **Chainlink Price Feeds** for realistic arbitrage checks and is deployed/tested on the **Sepolia testnet**.

---

## 📖 Table of Contents
- [⚡ FlashX — Aave V3 Flash Loan Simulator](#-flashx--aave-v3-flash-loan-simulator)
  - [📖 Table of Contents](#-table-of-contents)
  - [🔎 Overview](#-overview)
  - [✨ Features](#-features)
  - [🏗 Architecture](#-architecture)
  - [🧰 Tech Stack](#-tech-stack)
  - [📂 Project Structure](#-project-structure)
  - [🔐 Smart Contract Design](#-smart-contract-design)
  - [🔗 Chainlink Integration](#-chainlink-integration)
  - [🎨 Frontend Design](#-frontend-design)
  - [⚙️ Installation](#️-installation)
    - [Backend](#backend)
    - [Frontend](#frontend)
  - [🚀 Usage](#-usage)
  - [✅ Testing](#-testing)
  - [🚢 Deployment](#-deployment)
  - [🛡 Security Considerations](#-security-considerations)
  - [🔮 Future Enhancements](#-future-enhancements)
  - [📜 License](#-license)
  - [🙏 Acknowledgements](#-acknowledgements)

---

## 🔎 Overview
Flash loans allow borrowing of assets **without collateral**, provided they are repaid within the same transaction.  
FlashX demonstrates:
- Borrowing from **Aave V3 Pool**
- Executing a **mock arbitrage trade**
- Using **Chainlink Price Feeds** to evaluate profit/loss
- Repaying loan + premium atomically

---

## ✨ Features
- Aave V3 flash loan request + repayment in one tx
- Chainlink Price Feeds for real market data validation
- Mock arbitrage simulation (swap token A → B → A)
- Frontend UI for triggering flash loan simulation
- Strongly-typed deployment scripts and tests (TypeScript)
- Deployed and tested on **Sepolia testnet**

---

## 🏗 Architecture
- **Backend (Hardhat + TS)**  
  - Solidity contracts (`FlashLoan.sol`)  
  - Deployment scripts (`deploy.ts`)  
  - Interaction scripts (`simulateFlashLoan.ts`)  
  - Tests (`FlashLoan.test.ts`)  

- **Frontend (Next.js + TS)**  
  - Wallet connection (RainbowKit + wagmi)  
  - Contract calls (ethers.js/viem)  
  - Flash loan form UI  

- **Chainlink Price Feeds**: Validate arbitrage based on live token prices  
- **Sepolia Testnet**: Long-term supported Ethereum testnet  

---

## 🧰 Tech Stack
- **Smart Contracts**: Solidity ^0.8.24  
- **Framework**: Hardhat + TypeScript  
- **Libraries**: OpenZeppelin, Aave V3 interfaces  
- **Testing**: Mocha + Chai + Hardhat Toolbox  
- **Frontend**: Next.js + React + RainbowKit + wagmi + TailwindCSS  
- **Oracles**: Chainlink Data Feeds (ETH/DAI, ETH/USDC)  

---

## 📂 Project Structure
```
flashx/
│── contracts/
│   ├── FlashLoan.sol
│   └── interfaces/
│       ├── IPool.sol
│       ├── IFlashLoanReceiver.sol
│       ├── IERC20.sol
│       └── AggregatorV3Interface.sol
│── scripts/
│   ├── deploy.ts
│   └── simulateFlashLoan.ts
│── test/
│   └── FlashLoan.test.ts
│── frontend/
│   ├── pages/index.tsx
│   ├── components/FlashLoanForm.tsx
│   ├── styles/globals.css
│   └── ...
│── hardhat.config.ts
│── tsconfig.json
│── .env.example
│── README.md
```

---

## 🔐 Smart Contract Design
- Implements `IFlashLoanSimpleReceiver` from Aave V3  
- `requestFlashLoan(asset, amount)` → triggers loan  
- `executeOperation()` → called by Aave Pool:
  - Simulates arbitrage trade  
  - Uses Chainlink feeds for price validation  
  - Repays borrowed amount + premium  
- Security:
  - Checks-Effects-Interactions pattern  
  - ReentrancyGuard  
  - Event logging (`FlashLoanExecuted`, `ArbitrageSimulated`)  

---

## 🔗 Chainlink Integration
- **Price Feeds**:
  - Example: ETH/USD, DAI/USD  
  - Used to calculate expected arbitrage gain/loss  
- **Keepers (optional)**:
  - Automate flash loan trigger when price spread > X%  

---

## 🎨 Frontend Design
- **Wallet connection** via RainbowKit + wagmi  
- **Form** for selecting token + amount  
- **Trigger button** → calls `requestFlashLoan()`  
- **Logs** displayed: borrowed asset, premium, simulated profit  

---

## ⚙️ Installation

### Backend
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Usage
1. Deploy contract:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

2. Simulate flash loan:
```bash
npx hardhat run scripts/simulateFlashLoan.ts --network sepolia
```

3. Start frontend:
```bash
cd frontend
npm run dev
```

---

## ✅ Testing
```bash
npx hardhat test
```
Covers:
- Loan request & repayment  
- Arbitrage simulation  
- Price feed checks  
- Failure cases (not repaying, insufficient liquidity)  

---

## 🚢 Deployment
Deploy to Sepolia:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## 🛡 Security Considerations
- Ensure repayment always occurs (`require(success)`)  
- Protect against price oracle manipulation (use Chainlink only)  
- Avoid reentrancy via OpenZeppelin `ReentrancyGuard`  
- Simulate realistic arbitrage scenarios safely  

---

## 🔮 Future Enhancements
- Real arbitrage on Uniswap/Sushiswap testnets  
- Multi-asset flash loans  
- Chainlink Automation to auto-trigger opportunities  
- Subgraph analytics for flash loan history  

---

## 📜 License
MIT License — free to use with attribution.  

---

## 🙏 Acknowledgements
- [Aave V3 Protocol](https://aave.com)  
- [Chainlink Data Feeds](https://chain.link/)  
- [Hardhat](https://hardhat.org)  
- [RainbowKit](https://www.rainbowkit.com/)  
- [wagmi](https://wagmi.sh/)  

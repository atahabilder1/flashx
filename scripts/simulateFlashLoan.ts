import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("<
 Starting FlashLoan simulation...");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`=á Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`L No deployment found for network ${network.name}. Please deploy first.`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log(`=Ë FlashLoan contract: ${contractAddress}`);

  // Get contract instance
  const FlashLoan = await ethers.getContractFactory("FlashLoan");
  const flashLoan = FlashLoan.attach(contractAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`=d Signer: ${signer.address}`);

  // Check signer balance
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`=° Signer balance: ${ethers.formatEther(balance)} ETH`);

  // Token addresses (Sepolia testnet)
  const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
  const DAI_ADDRESS = "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357";

  // Flash loan amount (1 WETH)
  const flashLoanAmount = ethers.parseEther("1");

  console.log("\n= Pre-simulation checks:");
  console.log("========================");

  // Check current prices
  try {
    const wethPrice = await flashLoan.getAssetPrice(WETH_ADDRESS);
    console.log(`WETH Price: $${ethers.formatUnits(wethPrice, 8)}`);

    const daiPrice = await flashLoan.getAssetPrice(DAI_ADDRESS);
    console.log(`DAI Price: $${ethers.formatUnits(daiPrice, 8)}`);
  } catch (error) {
    console.log("   Warning: Could not fetch current prices (expected on mainnet fork)");
  }

  // Check contract ownership
  const owner = await flashLoan.owner();
  console.log(`Contract Owner: ${owner}`);
  console.log(`Is Signer Owner: ${owner.toLowerCase() === signer.address.toLowerCase()}`);

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("L Signer is not the contract owner. Cannot execute flash loan.");
  }

  // Check Aave Pool configuration
  const poolAddress = await flashLoan.POOL();
  console.log(`Aave Pool: ${poolAddress}`);

  console.log("\n=€ Executing Flash Loan Simulation:");
  console.log("===================================");

  try {
    // Set up event listeners
    console.log("=á Setting up event listeners...");

    flashLoan.on("FlashLoanExecuted", (asset, amount, premium, initiator, event) => {
      console.log("\n FlashLoanExecuted Event:");
      console.log(`   Asset: ${asset}`);
      console.log(`   Amount: ${ethers.formatEther(amount)} tokens`);
      console.log(`   Premium: ${ethers.formatEther(premium)} tokens`);
      console.log(`   Initiator: ${initiator}`);
      console.log(`   Block: ${event.blockNumber}`);
    });

    flashLoan.on("ArbitrageSimulated", (asset, amount, initialPrice, finalPrice, profit, successful, event) => {
      console.log("\n=Ê ArbitrageSimulated Event:");
      console.log(`   Asset: ${asset}`);
      console.log(`   Amount: ${ethers.formatEther(amount)} tokens`);
      console.log(`   Initial Price: $${ethers.formatUnits(initialPrice, 8)}`);
      console.log(`   Final Price: $${ethers.formatUnits(finalPrice, 8)}`);
      console.log(`   Profit: $${ethers.formatUnits(profit, 8)}`);
      console.log(`   Successful: ${successful}`);
      console.log(`   Block: ${event.blockNumber}`);
    });

    // Execute flash loan
    console.log(`=¸ Requesting flash loan of ${ethers.formatEther(flashLoanAmount)} WETH...`);

    const tx = await flashLoan.requestFlashLoan(WETH_ADDRESS, flashLoanAmount, {
      gasLimit: 500000 // Set explicit gas limit
    });

    console.log(`=Ý Transaction hash: ${tx.hash}`);
    console.log("ó Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(` Transaction confirmed in block ${receipt?.blockNumber}`);

    // Wait a bit for events to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("\n=Ë Post-simulation Analysis:");
    console.log("============================");

    // Check arbitrage history
    try {
      const arbitrageData = await flashLoan.arbitrageHistory(WETH_ADDRESS);
      console.log("Arbitrage History for WETH:");
      console.log(`   Initial Price: $${ethers.formatUnits(arbitrageData.initialPrice, 8)}`);
      console.log(`   Final Price: $${ethers.formatUnits(arbitrageData.finalPrice, 8)}`);
      console.log(`   Profit: $${ethers.formatUnits(arbitrageData.profit, 8)}`);
      console.log(`   Successful: ${arbitrageData.successful}`);
    } catch (error) {
      console.log("   Could not fetch arbitrage history");
    }

    // Check contract balance
    const contractBalance = await flashLoan.getContractBalance(WETH_ADDRESS);
    console.log(`Contract WETH Balance: ${ethers.formatEther(contractBalance)}`);

    console.log("\n<‰ Flash Loan simulation completed successfully!");

  } catch (error: any) {
    console.error("\nL Flash Loan simulation failed:");

    if (error.message.includes("insufficient funds")) {
      console.error("=¡ Tip: Make sure you have enough ETH for gas fees");
    } else if (error.message.includes("execution reverted")) {
      console.error("=¡ Tip: This might be expected on a fork without sufficient liquidity");
    } else if (error.message.includes("UNPREDICTABLE_GAS_LIMIT")) {
      console.error("=¡ Tip: Try running on a proper Sepolia testnet with funded accounts");
    }

    console.error("Error details:", error.message);
  }

  console.log("\n=Ê Simulation Summary:");
  console.log("======================");
  console.log(`Network: ${network.name}`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Flash Loan Amount: ${ethers.formatEther(flashLoanAmount)} WETH`);
  console.log(`Signer: ${signer.address}`);
  console.log(`Gas Used: Check transaction receipt for details`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("L Simulation script failed:", error);
    process.exit(1);
  });
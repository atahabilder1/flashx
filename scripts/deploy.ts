import { ethers } from "hardhat";
import { verify } from "../utils/verify";

async function main() {
  console.log("=€ Starting FlashLoan contract deployment...");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`=á Deploying to network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`=d Deploying with account: ${deployer.address}`);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`=° Account balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("L Insufficient balance. Need at least 0.01 ETH for deployment");
  }

  // Deploy FlashLoan contract
  console.log("\n=Ë Deploying FlashLoan contract...");
  const FlashLoan = await ethers.getContractFactory("FlashLoan");

  const flashLoan = await FlashLoan.deploy();
  await flashLoan.waitForDeployment();

  const contractAddress = await flashLoan.getAddress();
  console.log(` FlashLoan contract deployed to: ${contractAddress}`);

  // Wait for block confirmations before verification
  if (network.chainId !== 31337n) { // Skip for local hardhat network
    console.log("ó Waiting for block confirmations...");
    await flashLoan.deploymentTransaction()?.wait(6);

    // Verify contract on Etherscan
    console.log("= Verifying contract on Etherscan...");
    try {
      await verify(contractAddress, []);
      console.log(" Contract verified successfully!");
    } catch (error) {
      console.log("L Contract verification failed:", error);
    }
  }

  // Display deployment summary
  console.log("\n=Ê Deployment Summary:");
  console.log("========================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.chainId}`);

  // Display useful contract info
  console.log("\n=' Contract Information:");
  console.log("=========================");
  const pool = await flashLoan.POOL();
  const addressesProvider = await flashLoan.ADDRESSES_PROVIDER();
  console.log(`Aave Pool: ${pool}`);
  console.log(`Addresses Provider: ${addressesProvider}`);

  // Save deployment info to file
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    aavePool: pool,
    addressesProvider: addressesProvider
  };

  const fs = require("fs");
  const path = require("path");

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`=Ý Deployment info saved to: ${deploymentFile}`);

  console.log("\n<‰ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("L Deployment failed:", error);
    process.exit(1);
  });
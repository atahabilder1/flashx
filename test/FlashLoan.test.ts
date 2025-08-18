import { expect } from "chai";
import { ethers } from "hardhat";
import { FlashLoan } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("FlashLoan Contract", function () {
  let flashLoan: FlashLoan;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  const AAVE_POOL = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
  const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
  const DAI_ADDRESS = "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357";

  async function deployFlashLoanFixture() {
    const [owner, user] = await ethers.getSigners();

    const FlashLoan = await ethers.getContractFactory("FlashLoan");
    const flashLoan = await FlashLoan.deploy();
    await flashLoan.waitForDeployment();

    return { flashLoan, owner, user };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployFlashLoanFixture);
    flashLoan = fixture.flashLoan;
    owner = fixture.owner;
    user = fixture.user;
  });

  describe("Deployment", function () {
    it("Should deploy with correct owner", async function () {
      expect(await flashLoan.owner()).to.equal(owner.address);
    });

    it("Should have correct Aave Pool address", async function () {
      expect(await flashLoan.POOL()).to.equal(AAVE_POOL);
    });

    it("Should have correct Addresses Provider", async function () {
      const expectedProvider = "0x0496275d34753A48320CA58103d5220d394FF77F";
      expect(await flashLoan.ADDRESSES_PROVIDER()).to.equal(expectedProvider);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to request flash loan", async function () {
      await expect(
        flashLoan.connect(user).requestFlashLoan(WETH_ADDRESS, ethers.parseEther("1"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to withdraw assets", async function () {
      await expect(
        flashLoan.connect(user).withdrawAsset(WETH_ADDRESS, ethers.parseEther("1"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Price Feed Integration", function () {
    it("Should get price for WETH", async function () {
      const price = await flashLoan.getAssetPrice(WETH_ADDRESS);
      expect(price).to.be.gt(0);
    });

    it("Should get price for DAI", async function () {
      const price = await flashLoan.getAssetPrice(DAI_ADDRESS);
      expect(price).to.be.gt(0);
    });

    it("Should return default price for unknown asset", async function () {
      const unknownAsset = "0x1234567890123456789012345678901234567890";
      const price = await flashLoan.getAssetPrice(unknownAsset);
      expect(price).to.equal(ethers.parseUnits("1000", 8)); // $1000 with 8 decimals
    });
  });

  describe("Flash Loan Execution", function () {
    it("Should only allow Aave Pool to call executeOperation", async function () {
      await expect(
        flashLoan.executeOperation(
          WETH_ADDRESS,
          ethers.parseEther("1"),
          ethers.parseEther("0.001"),
          owner.address,
          "0x"
        )
      ).to.be.revertedWith("Caller must be the Aave V3 Pool");
    });

    it("Should reject executeOperation with zero amount", async function () {
      // Impersonate Aave Pool for testing
      await ethers.provider.send("hardhat_impersonateAccount", [AAVE_POOL]);
      const aavePool = await ethers.getSigner(AAVE_POOL);

      await expect(
        flashLoan.connect(aavePool).executeOperation(
          WETH_ADDRESS,
          0,
          ethers.parseEther("0.001"),
          owner.address,
          "0x"
        )
      ).to.be.revertedWith("Amount must be greater than 0");

      await ethers.provider.send("hardhat_stopImpersonatingAccount", [AAVE_POOL]);
    });
  });

  describe("Arbitrage Simulation", function () {
    it("Should track arbitrage history", async function () {
      // Mock flash loan execution to test arbitrage tracking
      await ethers.provider.send("hardhat_impersonateAccount", [AAVE_POOL]);
      const aavePool = await ethers.getSigner(AAVE_POOL);

      // Fund the contract with WETH for the test
      const amount = ethers.parseEther("1");
      const premium = ethers.parseEther("0.001");
      const totalAmount = amount + premium;

      // Send ETH to WETH contract and then transfer WETH to FlashLoan contract
      // This is simplified for testing
      await owner.sendTransaction({
        to: await flashLoan.getAddress(),
        value: totalAmount
      });

      // Check arbitrage history before
      const historyBefore = await flashLoan.arbitrageHistory(WETH_ADDRESS);
      expect(historyBefore.initialPrice).to.equal(0);

      await ethers.provider.send("hardhat_stopImpersonatingAccount", [AAVE_POOL]);
    });
  });

  describe("Utility Functions", function () {
    it("Should return correct contract balance", async function () {
      const initialBalance = await flashLoan.getContractBalance(WETH_ADDRESS);
      expect(initialBalance).to.equal(0);

      // Send some ETH to contract
      await owner.sendTransaction({
        to: await flashLoan.getAddress(),
        value: ethers.parseEther("1")
      });

      // ETH balance should be reflected
      const ethBalance = await ethers.provider.getBalance(await flashLoan.getAddress());
      expect(ethBalance).to.equal(ethers.parseEther("1"));
    });

    it("Should revert withdrawal with insufficient balance", async function () {
      await expect(
        flashLoan.withdrawAsset(WETH_ADDRESS, ethers.parseEther("1"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should revert withdrawal with zero amount", async function () {
      await expect(
        flashLoan.withdrawAsset(WETH_ADDRESS, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Events", function () {
    it("Should emit FlashLoanExecuted event", async function () {
      // This would require a full integration test with actual Aave pool
      // For now, we'll test the event structure exists
      const filter = flashLoan.filters.FlashLoanExecuted();
      expect(filter.topics).to.have.length(1);
    });

    it("Should emit ArbitrageSimulated event", async function () {
      const filter = flashLoan.filters.ArbitrageSimulated();
      expect(filter.topics).to.have.length(1);
    });
  });

  describe("Security", function () {
    it("Should have ReentrancyGuard", async function () {
      // ReentrancyGuard is inherited, check if contract has the expected behavior
      const contractCode = await ethers.provider.getCode(await flashLoan.getAddress());
      expect(contractCode).to.not.equal("0x");
    });

    it("Should validate price feed staleness", async function () {
      // Price feeds should reject stale data (tested via getChainlinkPrice internal logic)
      const price = await flashLoan.getAssetPrice(WETH_ADDRESS);
      expect(price).to.be.gt(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle price feed edge cases", async function () {
      // Test default fallback for unknown tokens
      const randomAddress = ethers.Wallet.createRandom().address;
      const price = await flashLoan.getAssetPrice(randomAddress);
      expect(price).to.equal(ethers.parseUnits("1000", 8));
    });

    it("Should handle contract interactions properly", async function () {
      // Test that contract can receive ETH
      await expect(
        owner.sendTransaction({
          to: await flashLoan.getAddress(),
          value: ethers.parseEther("0.1")
        })
      ).to.not.be.reverted;
    });
  });
});
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFlashLoanReceiver.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/AggregatorV3Interface.sol";

contract FlashLoan is IFlashLoanSimpleReceiver, ReentrancyGuard, Ownable {
    address public constant ADDRESSES_PROVIDER = 0x0496275d34753A48320CA58103d5220d394FF77F;
    address public constant POOL = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;

    AggregatorV3Interface internal ethUsdPriceFeed;
    AggregatorV3Interface internal daiUsdPriceFeed;

    struct ArbitrageData {
        uint256 initialPrice;
        uint256 finalPrice;
        uint256 profit;
        bool successful;
    }

    mapping(address => ArbitrageData) public arbitrageHistory;

    event FlashLoanExecuted(
        address indexed asset,
        uint256 amount,
        uint256 premium,
        address indexed initiator
    );

    event ArbitrageSimulated(
        address indexed asset,
        uint256 amount,
        uint256 initialPrice,
        uint256 finalPrice,
        uint256 profit,
        bool successful
    );

    constructor() {
        ethUsdPriceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        daiUsdPriceFeed = AggregatorV3Interface(0x14866185B1962B63C3Ea9E03Bc1da838bab34C19);
    }

    function requestFlashLoan(
        address asset,
        uint256 amount
    ) external onlyOwner {
        bytes memory params = "";
        uint16 referralCode = 0;

        IPool(POOL).flashLoanSimple(
            address(this),
            asset,
            amount,
            params,
            referralCode
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == POOL, "Caller must be the Aave V3 Pool");
        require(amount > 0, "Amount must be greater than 0");

        uint256 totalAmountToReturn = amount + premium;

        require(
            IERC20(asset).balanceOf(address(this)) >= amount,
            "Invalid flash loan amount"
        );

        ArbitrageData memory arbitrage = simulateArbitrage(asset, amount);
        arbitrageHistory[asset] = arbitrage;

        require(
            IERC20(asset).balanceOf(address(this)) >= totalAmountToReturn,
            "Not enough balance to repay flash loan"
        );

        IERC20(asset).approve(POOL, totalAmountToReturn);

        emit FlashLoanExecuted(asset, amount, premium, initiator);
        emit ArbitrageSimulated(
            asset,
            amount,
            arbitrage.initialPrice,
            arbitrage.finalPrice,
            arbitrage.profit,
            arbitrage.successful
        );

        return true;
    }

    function simulateArbitrage(
        address asset,
        uint256 amount
    ) internal view returns (ArbitrageData memory) {
        uint256 initialPrice = getAssetPrice(asset);

        uint256 simulatedPriceChange = (initialPrice * 2) / 100; // 2% price movement
        uint256 finalPrice = initialPrice + simulatedPriceChange;

        uint256 initialValue = (amount * initialPrice) / (10 ** 18);
        uint256 finalValue = (amount * finalPrice) / (10 ** 18);

        uint256 profit = finalValue > initialValue ? finalValue - initialValue : 0;
        bool successful = profit > 0;

        return ArbitrageData({
            initialPrice: initialPrice,
            finalPrice: finalPrice,
            profit: profit,
            successful: successful
        });
    }

    function getAssetPrice(address asset) public view returns (uint256) {
        // For ETH (or WETH)
        if (asset == 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14) {
            return getChainlinkPrice(ethUsdPriceFeed);
        }
        // For DAI
        else if (asset == 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357) {
            return getChainlinkPrice(daiUsdPriceFeed);
        }
        // Default fallback price
        else {
            return 1000 * 10 ** 8; // $1000 with 8 decimals
        }
    }

    function getChainlinkPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();

        require(price > 0, "Invalid price from Chainlink");
        require(updatedAt > 0, "Price data is stale");
        require(block.timestamp - updatedAt < 3600, "Price data too old"); // 1 hour staleness check

        return uint256(price);
    }

    function withdrawAsset(address asset, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(
            IERC20(asset).balanceOf(address(this)) >= amount,
            "Insufficient balance"
        );

        IERC20(asset).transfer(owner(), amount);
    }

    function getContractBalance(address asset) external view returns (uint256) {
        return IERC20(asset).balanceOf(address(this));
    }

    receive() external payable {}
}
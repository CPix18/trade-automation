require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const { SEP_ALCHEMY_API_KEY, SEP_UNISWAP_ROUTER_V2, WETH_SEPOLIA } = require("../config");

// Load wallets from file
const wallets = JSON.parse(fs.readFileSync("wallets.json"));

// Set up provider, will need to change if using Mainnet
const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/<API_KEY_HERE>`);

// Fetch ETH price from Coingecko
async function getEthPrice() {
    try {
        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
            params: { ids: "ethereum", vs_currencies: "usd" },
        });
        return response.data.ethereum.usd;
    } catch (error) {
        console.error("Error fetching ETH price:", error);
        return null;
    }
}

// Fetch gas price
async function getGasPrice() {
    const feeData = await provider.getFeeData();
    return ethers.formatUnits(feeData.gasPrice, "gwei");
}

// Execute trade (ETH → Token)
async function executeTrade(tokenAddress, ethAmount) {
    try {
        const wallet = new ethers.Wallet(wallets[0].privateKey, provider); // Use first wallet
        const router = new ethers.Contract(
            SEP_UNISWAP_ROUTER_V2,
            ["function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable"],
            wallet
        );

        const ethPrice = await getEthPrice();
        const gasPrice = await getGasPrice();

        const path = [WETH_SEPOLIA, tokenAddress]; // Swap ETH to Token via WETH

        console.log("Swapping ETH for token...");
        console.log("Trade Path:", path);

        const tx = await router.swapExactETHForTokens(
            0, // No slippage protection for now
            path,
            wallet.address,
            Math.floor(Date.now() / 1000) + 60 * 10, // 10-minute deadline
            {
                value: ethers.parseEther(ethAmount), // ETH amount to swap
                gasPrice: ethers.parseUnits(gasPrice, "gwei"),
            }
        );

        console.log(`Trade executed! TX Hash: ${tx.hash}`);
        logTrade(wallet, tx.hash, tokenAddress, ethAmount, ethPrice);
    } catch (error) {
        console.error("Error executing trade:", error);
    }
}

// Log trade details to CSV
function logTrade(wallet, txHash, token, ethAmount, ethPrice) {
    const csvWriter = createCsvWriter({
        path: "trade-log.csv",
        header: [
            { id: "date", title: "Date" },
            { id: "type", title: "Buy/Sell" },
            { id: "walletAddress", title: "Wallet Address" },
            { id: "walletName", title: "Wallet Name" },
            { id: "txHash", title: "Transaction Hash" },
            { id: "token", title: "Token Name" },
            { id: "ethAmount", title: "ETH Amount" },
            { id: "usdValue", title: "USD Value" },
            { id: "ethPrice", title: "ETH Current Price" },
        ],
        append: true,
    });

    csvWriter
        .writeRecords([
            {
                date: new Date().toISOString(),
                type: "Buy",
                walletAddress: wallet.address,
                walletName: wallet.name,
                txHash,
                token,
                ethAmount,
                usdValue: parseFloat(ethAmount) * ethPrice,
                ethPrice,
            },
        ])
        .then(() => console.log("Trade logged successfully!"));
}

// Command-line execution
const [tokenAddress, ethAmount] = process.argv.slice(2);

if (!tokenAddress || !ethAmount) {
    console.error("Usage: node trade.js <tokenAddress> <ethAmount>");
    process.exit(1);
}

executeTrade(tokenAddress, ethAmount);

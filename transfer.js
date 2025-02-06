require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const { ALCHEMY_API_KEY } = require("../config");

// Load wallet, change alchemy link if using mainnet
const wallets = JSON.parse(fs.readFileSync("wallets.json"));
const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/<API_KEY_HERE>`);
const wallet = new ethers.Wallet(wallets[0].privateKey, provider);

// ERC-20 Token ABI (Minimal for balance & transfer)
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address recipient, uint256 amount) returns (bool)"
];

// Log transfer details to CSV
function logTransfer(txHash, from, to, token, amount) {
    const csvWriter = createCsvWriter({
        path: "transfer-log.csv",
        header: [
            { id: "date", title: "Date" },
            { id: "from", title: "From Address" },
            { id: "to", title: "To Address" },
            { id: "token", title: "Token Address" },
            { id: "amount", title: "Token Amount" },
            { id: "txHash", title: "Transaction Hash" }
        ],
        append: true,
    });

    csvWriter
        .writeRecords([
            {
                date: new Date().toISOString(),
                from,
                to,
                token,
                amount,
                txHash,
            },
        ])
        .then(() => console.log("Transfer logged successfully!"));
}

// Execute transfer
async function executeTransfer(destination, tokenAddress) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

        // Get balance
        const balance = await tokenContract.balanceOf(wallet.address);
        const formattedBalance = ethers.formatUnits(balance, 6); // Assuming 18 decimals

        if (balance <= 0) {
            console.log("No tokens available for transfer.");
            return;
        }

        console.log(`Sending ${formattedBalance} tokens to ${destination}...`);

        // Send transfer
        const tx = await tokenContract.transfer(destination, balance);
        await tx.wait();

        console.log(`Transfer successful! TX Hash: ${tx.hash}`);

        // Log transfer
        logTransfer(tx.hash, wallet.address, destination, tokenAddress, formattedBalance);
    } catch (error) {
        console.error("Error executing transfer:", error);
    }
}

// Command-line execution
const [destination, tokenAddress] = process.argv.slice(2);

if (!destination || !tokenAddress) {
    console.error("Usage: node transfer.js <destinationAddress> <tokenAddress>");
    process.exit(1);
}

executeTransfer(destination, tokenAddress);

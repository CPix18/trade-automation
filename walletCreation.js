const { Wallet, utils } = require("ethers");
const fs = require("fs");

function createWallets(numWallets) {
    let wallets = [];
    for (let i = 0; i < numWallets; i++) {
        let wallet = Wallet.createRandom();
        wallets.push({
            name: `wallet${i + 1}`,
            address: wallet.address,
            privateKey: wallet.privateKey,
        });
    }

    fs.writeFileSync("wallets.json", JSON.stringify(wallets, null, 2));
    console.log("Wallets generated and saved!");
}

const numWallets = process.argv[2] || 1; // Default to 1 wallet
createWallets(parseInt(numWallets));

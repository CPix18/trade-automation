require("dotenv").config();

module.exports = {
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    SEP_ALCHEMY_API_KEY: process.env.SEP_ALCHEMY_API_KEY,
    WETH_SEPOLIA: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // WETH Address on Sepolia
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    UNISWAP_ROUTER_V2: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router
    SEP_UNISWAP_ROUTER_V2: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3", // Sepolia Uniswap V2 Router
};

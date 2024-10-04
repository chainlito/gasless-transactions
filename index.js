const dotenv = require("dotenv");
const { ethers } = require("ethers");
const { createSmartAccountClient, PaymasterMode } = require("@biconomy/account");

dotenv.config();

// Your configuration with private key and Biconomy API key
const config = {
  privateKey: process.env.PRIVATE_KEY,
  bundlerUrl: process.env.BUNDLER_URL, // <-- Read about this at https://docs.biconomy.io/dashboard#bundler-url
  rpcUrl: "https://rpc2.sepolia.org",
  paymasterApiKey: process.env.PAYMASTER_API_KEY
};

const main = async () => {
  // Generate EOA from private key using ethers.js
  let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  let signer = new ethers.Wallet(config.privateKey, provider);
  
  // Create Biconomy Smart Account instance
  const smartWallet = await createSmartAccountClient({
    signer,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.paymasterApiKey,
  });


  const saAddress = await smartWallet.getAccountAddress();
  console.log("SA Address", saAddress);

  const toAddress = process.env.UNISWAP_ROUTER_ADDRESS; // Replace with the recipient's address
  const transactionData = "0x123"; // Replace with the actual transaction data
  
  // Encode Uniswap swap function call
  const UniswapRouterInterface = new ethers.utils.Interface([
    "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)"
  ]);
  // Build the transaction
  const tx = {
    to: toAddress,
    data: UniswapRouterInterface.encodeFunctionData(
      "swapExactETHForTokens",
      [0, [process.env.WETH_ADDRESS, process.env.TOKEN_ADDRESS], saAddress, 1733089740]
    ),
    value: 200000000000000000
  };

  // Send the transaction and get the transaction hash
  const userOpResponse = await smartWallet.sendTransaction(tx, {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED },
  });
  const { transactionHash } = await userOpResponse.waitForTxHash();
  console.log("Transaction Hash", transactionHash);
  
  const userOpReceipt = await userOpResponse.wait();
  if (userOpReceipt.success == "true") {
    console.log("UserOp receipt", userOpReceipt);
    console.log("Transaction receipt", userOpReceipt.receipt);
  }
}

main();
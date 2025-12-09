// scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying CivicChain Contracts...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy CivicToken
  console.log("Deploying CivicToken...");
  const CivicToken = await hre.ethers.getContractFactory("CivicToken");
  const token = await CivicToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("CivicToken deployed to:", tokenAddress);

  // Deploy CivicChainGovernance
  console.log("Deploying CivicChainGovernance...");
  const Governance = await hre.ethers.getContractFactory("CivicChainGovernance");
  const gov = await Governance.deploy(tokenAddress);
  await gov.waitForDeployment();
  const govAddress = await gov.getAddress();
  console.log("CivicChainGovernance deployed to:", govAddress);

  // Transfer 500,000 CIVIC tokens to governance for grants
  console.log("\nTransferring 500,000 CIVIC tokens to governance contract...");
  const transferTx = await token.transfer(govAddress, hre.ethers.parseEther("500000"));
  await transferTx.wait();
  console.log("Transfer complete!");

  // Save addresses
  const addresses = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    deployer: deployer.address,
    CivicToken: tokenAddress,
    CivicChainGovernance: govAddress,
    deployedAt: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, "../addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to:", outputPath);

  console.log("\nDEPLOYMENT SUCCESSFUL!");
  console.log("Next steps:");
  console.log("   1. Verify contracts on Polygonscan (if on Mumbai/Polygon)");
  console.log("   2. Update frontend with these addresses");
  console.log("   3. Start building!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("DEPLOYMENT FAILED:", error);
    process.exit(1);
  });
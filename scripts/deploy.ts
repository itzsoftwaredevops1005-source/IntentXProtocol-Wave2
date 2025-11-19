import { ethers } from "hardhat";

async function main() {
  console.log("Deploying IntentX DeFi Protocol...");

  // Deploy Intent Registry
  const IntentRegistry = await ethers.getContractFactory("IntentRegistry");
  const registry = await IntentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("IntentRegistry deployed to:", registryAddress);

  // Deploy Mock Router
  const MockRouter = await ethers.getContractFactory("MockRouter");
  const router = await MockRouter.deploy();
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("MockRouter deployed to:", routerAddress);

  // Deploy Execution Manager
  const ExecutionManager = await ethers.getContractFactory("ExecutionManager");
  const executionManager = await ExecutionManager.deploy(registryAddress, routerAddress);
  await executionManager.waitForDeployment();
  const executionManagerAddress = await executionManager.getAddress();
  console.log("ExecutionManager deployed to:", executionManagerAddress);

  // Deploy Lending Pool Mock
  const LendingPoolMock = await ethers.getContractFactory("LendingPoolMock");
  const lendingPool = await LendingPoolMock.deploy();
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("LendingPoolMock deployed to:", lendingPoolAddress);

  // Deploy mock tokens for testing with proper decimals
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const usdc = await MockERC20.deploy("USD Coin", "USDC", ethers.parseUnits("1000000", 6), 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  const weth = await MockERC20.deploy("Wrapped Ether", "WETH", ethers.parseEther("10000"), 18);
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("Mock WETH deployed to:", wethAddress);

  // Deploy Staking Vault
  const StakingVault = await ethers.getContractFactory("StakingVault");
  const rewardRate = ethers.parseEther("0.0001"); // 0.0001 tokens per second
  const stakingVault = await StakingVault.deploy(usdcAddress, wethAddress, rewardRate);
  await stakingVault.waitForDeployment();
  const stakingVaultAddress = await stakingVault.getAddress();
  console.log("StakingVault deployed to:", stakingVaultAddress);

  // Create a pair for USDC/WETH
  const createPairTx = await router.createPair(usdcAddress, wethAddress);
  await createPairTx.wait();
  const pairAddress = await router.getPair(usdcAddress, wethAddress);
  console.log("USDC/WETH Pair created at:", pairAddress);

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("IntentRegistry:", registryAddress);
  console.log("ExecutionManager:", executionManagerAddress);
  console.log("MockRouter:", routerAddress);
  console.log("LendingPoolMock:", lendingPoolAddress);
  console.log("StakingVault:", stakingVaultAddress);
  console.log("Mock USDC:", usdcAddress);
  console.log("Mock WETH:", wethAddress);
  console.log("USDC/WETH Pair:", pairAddress);
  
  return {
    registry: registryAddress,
    executionManager: executionManagerAddress,
    router: routerAddress,
    lendingPool: lendingPoolAddress,
    stakingVault: stakingVaultAddress,
    usdc: usdcAddress,
    weth: wethAddress,
    pair: pairAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export default main;

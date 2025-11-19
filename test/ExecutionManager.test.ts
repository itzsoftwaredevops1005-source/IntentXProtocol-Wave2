import { expect } from "chai";
import { ethers } from "hardhat";
import { ExecutionManager, IntentRegistry, MockRouter, MockERC20, MockPair } from "../typechain-types";

describe("ExecutionManager", function () {
  let executionManager: ExecutionManager;
  let registry: IntentRegistry;
  let router: MockRouter;
  let usdc: MockERC20;
  let weth: MockERC20;
  let pair: MockPair;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy Intent Registry
    const IntentRegistryFactory = await ethers.getContractFactory("IntentRegistry");
    registry = await IntentRegistryFactory.deploy();

    // Deploy Mock Router
    const MockRouterFactory = await ethers.getContractFactory("MockRouter");
    router = await MockRouterFactory.deploy();

    // Deploy Execution Manager
    const ExecutionManagerFactory = await ethers.getContractFactory("ExecutionManager");
    executionManager = await ExecutionManagerFactory.deploy(
      await registry.getAddress(),
      await router.getAddress()
    );

    // Deploy mock tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20Factory.deploy("USD Coin", "USDC", ethers.parseUnits("1000000", 6), 6);
    weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", ethers.parseEther("10000"), 18);

    // Create pair
    await router.createPair(await usdc.getAddress(), await weth.getAddress());
    const pairAddress = await router.getPair(await usdc.getAddress(), await weth.getAddress());
    
    const MockPairFactory = await ethers.getContractFactory("MockPair");
    pair = MockPairFactory.attach(pairAddress) as MockPair;

    // Initialize pair with liquidity
    await pair.initialize(ethers.parseUnits("100000", 6), ethers.parseEther("50"));
  });

  describe("Deployment", function () {
    it("Should set registry and router addresses", async function () {
      expect(await executionManager.registry()).to.equal(await registry.getAddress());
      expect(await executionManager.router()).to.equal(await router.getAddress());
    });
  });

  describe("Intent Execution", function () {
    let intentId: string;

    beforeEach(async function () {
      // Register an intent
      const naturalLanguage = "Swap 100 USDC for WETH";
      const parsedData = ethers.toUtf8Bytes("{}");
      const gasEstimate = ethers.parseUnits("0.005", "ether");

      await registry.connect(user1).registerIntent(naturalLanguage, parsedData, gasEstimate);
      const userIntents = await registry.getUserIntents(user1.address);
      intentId = userIntents[0];
    });

    it("Should execute an intent with swap step", async function () {
      const steps = [
        {
          actionType: 0, // Swap
          protocol: await router.getAddress(),
          tokenIn: await usdc.getAddress(),
          tokenOut: await weth.getAddress(),
          amount: ethers.parseUnits("100", 6)
        }
      ];

      await expect(executionManager.executeIntent(intentId, steps))
        .to.emit(executionManager, "IntentExecutionStarted")
        .withArgs(intentId);
    });

    it("Should revert if intent does not exist", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const steps = [];

      await expect(executionManager.executeIntent(fakeId, steps))
        .to.be.revertedWith("Intent does not exist");
    });

    it("Should revert if intent is not in Parsed status", async function () {
      await registry.connect(user1).updateIntentStatus(intentId, 3); // Completed
      const steps = [];

      await expect(executionManager.executeIntent(intentId, steps))
        .to.be.revertedWith("Intent not ready for execution");
    });
  });

  describe("Gas Estimation", function () {
    it("Should estimate gas for execution steps", async function () {
      const steps = [
        {
          actionType: 0, // Swap
          protocol: await router.getAddress(),
          tokenIn: await usdc.getAddress(),
          tokenOut: await weth.getAddress(),
          amount: ethers.parseUnits("100", 6)
        },
        {
          actionType: 1, // Stake
          protocol: ethers.ZeroAddress,
          tokenIn: await weth.getAddress(),
          tokenOut: ethers.ZeroAddress,
          amount: ethers.parseEther("1")
        }
      ];

      const gasEstimate = await executionManager.estimateGas(steps);
      expect(gasEstimate).to.be.greaterThan(0);
      expect(gasEstimate).to.equal(21000 + (steps.length * 100000));
    });

    it("Should return base gas for empty steps", async function () {
      const gasEstimate = await executionManager.estimateGas([]);
      expect(gasEstimate).to.equal(21000);
    });
  });
});

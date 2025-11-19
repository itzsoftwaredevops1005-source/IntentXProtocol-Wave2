import { expect } from "chai";
import { ethers } from "hardhat";
import { MockRouter, MockERC20, MockPair } from "../typechain-types";

describe("MockRouter", function () {
  let router: MockRouter;
  let token0: MockERC20;
  let token1: MockERC20;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const MockRouterFactory = await ethers.getContractFactory("MockRouter");
    router = await MockRouterFactory.deploy();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    token0 = await MockERC20Factory.deploy("Token0", "TK0", ethers.parseEther("10000"), 18);
    token1 = await MockERC20Factory.deploy("Token1", "TK1", ethers.parseEther("10000"), 18);
  });

  describe("Pair Creation", function () {
    it("Should create a new pair", async function () {
      const pairAddress = await router.createPair.staticCall(
        await token0.getAddress(),
        await token1.getAddress()
      );
      
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should store pair address bidirectionally", async function () {
      await router.createPair(await token0.getAddress(), await token1.getAddress());
      
      const pairForward = await router.getPair(await token0.getAddress(), await token1.getAddress());
      const pairReverse = await router.getPair(await token1.getAddress(), await token0.getAddress());
      
      expect(pairForward).to.equal(pairReverse);
      expect(pairForward).to.not.equal(ethers.ZeroAddress);
    });

    it("Should revert if pair already exists", async function () {
      await router.createPair(await token0.getAddress(), await token1.getAddress());
      
      await expect(router.createPair(await token0.getAddress(), await token1.getAddress()))
        .to.be.revertedWith("Pair already exists");
    });
  });

  describe("Swap Execution", function () {
    let pair: MockPair;

    beforeEach(async function () {
      await router.createPair(await token0.getAddress(), await token1.getAddress());
      const pairAddress = await router.getPair(await token0.getAddress(), await token1.getAddress());
      
      const MockPairFactory = await ethers.getContractFactory("MockPair");
      pair = MockPairFactory.attach(pairAddress) as MockPair;
      await pair.initialize(ethers.parseEther("1000"), ethers.parseEther("2000"));
    });

    it("Should execute swap with exact tokens for tokens", async function () {
      const path = [await token0.getAddress(), await token1.getAddress()];
      const amountIn = ethers.parseEther("100");
      const deadline = (await ethers.provider.getBlock('latest'))!.timestamp + 300;

      const amounts = await router.swapExactTokensForTokens(
        amountIn,
        0,
        path,
        owner.address,
        deadline
      );

      expect(amounts.length).to.equal(2);
      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.greaterThan(0);
    });

    it("Should revert if deadline expired", async function () {
      const path = [await token0.getAddress(), await token1.getAddress()];
      const amountIn = ethers.parseEther("100");
      const pastDeadline = (await ethers.provider.getBlock('latest'))!.timestamp - 1;

      await expect(router.swapExactTokensForTokens(amountIn, 0, path, owner.address, pastDeadline))
        .to.be.revertedWith("Transaction expired");
    });

    it("Should revert if path is invalid", async function () {
      const invalidPath = [await token0.getAddress()];
      const amountIn = ethers.parseEther("100");
      const deadline = (await ethers.provider.getBlock('latest'))!.timestamp + 300;

      await expect(router.swapExactTokensForTokens(amountIn, 0, invalidPath, owner.address, deadline))
        .to.be.revertedWith("Invalid path");
    });

    it("Should revert if pair does not exist", async function () {
      const token2 = await (await ethers.getContractFactory("MockERC20"))
        .deploy("Token2", "TK2", ethers.parseEther("10000"), 18);
      
      const path = [await token0.getAddress(), await token2.getAddress()];
      const amountIn = ethers.parseEther("100");
      const deadline = (await ethers.provider.getBlock('latest'))!.timestamp + 300;

      await expect(router.swapExactTokensForTokens(amountIn, 0, path, owner.address, deadline))
        .to.be.revertedWith("Pair does not exist");
    });

    it("Should emit Swap event", async function () {
      const path = [await token0.getAddress(), await token1.getAddress()];
      const amountIn = ethers.parseEther("100");
      const deadline = (await ethers.provider.getBlock('latest'))!.timestamp + 300;

      await expect(router.swapExactTokensForTokens(amountIn, 0, path, owner.address, deadline))
        .to.emit(router, "Swap");
    });
  });

  describe("Get Amounts Out", function () {
    beforeEach(async function () {
      await router.createPair(await token0.getAddress(), await token1.getAddress());
      const pairAddress = await router.getPair(await token0.getAddress(), await token1.getAddress());
      
      const MockPairFactory = await ethers.getContractFactory("MockPair");
      const pair = MockPairFactory.attach(pairAddress) as MockPair;
      await pair.initialize(ethers.parseEther("1000"), ethers.parseEther("2000"));
    });

    it("Should return amounts out for valid path", async function () {
      const path = [await token0.getAddress(), await token1.getAddress()];
      const amountIn = ethers.parseEther("100");

      const amounts = await router.getAmountsOut(amountIn, path);
      
      expect(amounts.length).to.equal(2);
      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.greaterThan(0);
    });

    it("Should revert for invalid path", async function () {
      const invalidPath = [await token0.getAddress()];
      const amountIn = ethers.parseEther("100");

      await expect(router.getAmountsOut(amountIn, invalidPath))
        .to.be.revertedWith("Invalid path");
    });
  });
});

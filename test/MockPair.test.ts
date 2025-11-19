import { expect } from "chai";
import { ethers } from "hardhat";
import { MockPair, MockERC20 } from "../typechain-types";

describe("MockPair", function () {
  let pair: MockPair;
  let token0: MockERC20;
  let token1: MockERC20;

  beforeEach(async function () {
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    token0 = await MockERC20Factory.deploy("Token0", "TK0", ethers.parseEther("10000"), 18);
    token1 = await MockERC20Factory.deploy("Token1", "TK1", ethers.parseEther("10000"), 18);

    const MockPairFactory = await ethers.getContractFactory("MockPair");
    pair = await MockPairFactory.deploy(await token0.getAddress(), await token1.getAddress());
  });

  describe("Initialization", function () {
    it("Should set token addresses correctly", async function () {
      expect(await pair.token0()).to.equal(await token0.getAddress());
      expect(await pair.token1()).to.equal(await token1.getAddress());
    });

    it("Should initialize reserves", async function () {
      await pair.initialize(ethers.parseEther("1000"), ethers.parseEther("2000"));
      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.equal(ethers.parseEther("1000"));
      expect(reserve1).to.equal(ethers.parseEther("2000"));
    });

    it("Should revert if initialized twice", async function () {
      await pair.initialize(ethers.parseEther("1000"), ethers.parseEther("2000"));
      await expect(
        pair.initialize(ethers.parseEther("500"), ethers.parseEther("500"))
      ).to.be.revertedWith("Already initialized");
    });
  });

  describe("Swap", function () {
    beforeEach(async function () {
      await pair.initialize(ethers.parseEther("1000"), ethers.parseEther("2000"));
    });

    it("Should execute a swap", async function () {
      const amount0Out = ethers.parseEther("10");
      const [owner] = await ethers.getSigners();

      await expect(pair.swap(amount0Out, 0, owner.address))
        .to.emit(pair, "Swap");
    });

    it("Should update reserves after swap", async function () {
      const amount0Out = ethers.parseEther("10");
      const [owner] = await ethers.getSigners();

      await pair.swap(amount0Out, 0, owner.address);
      const [reserve0After] = await pair.getReserves();
      expect(reserve0After).to.be.lessThan(ethers.parseEther("1000"));
    });

    it("Should revert if output amount is 0", async function () {
      const [owner] = await ethers.getSigners();
      await expect(pair.swap(0, 0, owner.address))
        .to.be.revertedWith("Insufficient output amount");
    });

    it("Should revert if insufficient liquidity", async function () {
      const [owner] = await ethers.getSigners();
      await expect(pair.swap(ethers.parseEther("1001"), 0, owner.address))
        .to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Get Amount Out", function () {
    it("Should calculate output amount correctly", async function () {
      const amountIn = ethers.parseEther("100");
      const reserveIn = ethers.parseEther("1000");
      const reserveOut = ethers.parseEther("2000");

      const amountOut = await pair.getAmountOut(amountIn, reserveIn, reserveOut);
      expect(amountOut).to.be.greaterThan(0);
      expect(amountOut).to.be.lessThan(ethers.parseEther("200")); // Less than direct ratio due to fees
    });

    it("Should revert if input amount is 0", async function () {
      await expect(pair.getAmountOut(0, 1000, 2000))
        .to.be.revertedWith("Insufficient input amount");
    });

    it("Should revert if reserves are 0", async function () {
      await expect(pair.getAmountOut(100, 0, 2000))
        .to.be.revertedWith("Insufficient liquidity");
    });
  });
});

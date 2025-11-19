import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPoolMock, MockERC20 } from "../typechain-types";

describe("LendingPoolMock", function () {
  let lendingPool: LendingPoolMock;
  let usdc: MockERC20;
  let weth: MockERC20;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const LendingPoolMockFactory = await ethers.getContractFactory("LendingPoolMock");
    lendingPool = await LendingPoolMockFactory.deploy();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20Factory.deploy("USD Coin", "USDC", ethers.parseUnits("1000000", 6), 6);
    weth = await MockERC20Factory.deploy("Wrapped Ether", "WETH", ethers.parseEther("10000"), 18);

    // Give users tokens
    await usdc.transfer(user1.address, ethers.parseUnits("10000", 6));
    await weth.transfer(user1.address, ethers.parseEther("100"));
    await usdc.transfer(user2.address, ethers.parseUnits("10000", 6));
  });

  describe("Supply", function () {
    it("Should allow users to supply tokens", async function () {
      const supplyAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), supplyAmount);

      await expect(lendingPool.connect(user1).supply(await usdc.getAddress(), supplyAmount))
        .to.emit(lendingPool, "Supply")
        .withArgs(user1.address, await usdc.getAddress(), supplyAmount);

      const account = await lendingPool.getUserAccount(user1.address, await usdc.getAddress());
      expect(account.supplied).to.equal(supplyAmount);
    });

    it("Should update total supplied", async function () {
      const supplyAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), supplyAmount);
      await lendingPool.connect(user1).supply(await usdc.getAddress(), supplyAmount);

      expect(await lendingPool.totalSupplied(await usdc.getAddress())).to.equal(supplyAmount);
    });

    it("Should revert if amount is 0", async function () {
      await expect(lendingPool.connect(user1).supply(await usdc.getAddress(), 0))
        .to.be.revertedWith("Invalid amount");
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      const supplyAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), supplyAmount);
      await lendingPool.connect(user1).supply(await usdc.getAddress(), supplyAmount);
    });

    it("Should allow users to withdraw supplied tokens", async function () {
      const withdrawAmount = ethers.parseUnits("500", 6);

      await expect(lendingPool.connect(user1).withdraw(await usdc.getAddress(), withdrawAmount))
        .to.emit(lendingPool, "Withdraw")
        .withArgs(user1.address, await usdc.getAddress(), withdrawAmount);

      const account = await lendingPool.getUserAccount(user1.address, await usdc.getAddress());
      expect(account.supplied).to.equal(ethers.parseUnits("500", 6));
    });

    it("Should revert if withdrawing more than supplied", async function () {
      await expect(lendingPool.connect(user1).withdraw(await usdc.getAddress(), ethers.parseUnits("2000", 6)))
        .to.be.revertedWith("Insufficient supplied balance");
    });

    it("Should update total supplied", async function () {
      const withdrawAmount = ethers.parseUnits("500", 6);
      await lendingPool.connect(user1).withdraw(await usdc.getAddress(), withdrawAmount);

      expect(await lendingPool.totalSupplied(await usdc.getAddress())).to.equal(ethers.parseUnits("500", 6));
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      // User1 supplies collateral
      const supplyAmount = ethers.parseUnits("10000", 6);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), supplyAmount);
      await lendingPool.connect(user1).supply(await usdc.getAddress(), supplyAmount);

      // Fund lending pool with WETH for borrowing
      await weth.transfer(await lendingPool.getAddress(), ethers.parseEther("10"));
    });

    it("Should allow users to borrow tokens", async function () {
      const borrowAmount = ethers.parseUnits("100", 6);

      await expect(lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount))
        .to.emit(lendingPool, "Borrow")
        .withArgs(user1.address, await usdc.getAddress(), borrowAmount);

      const account = await lendingPool.getUserAccount(user1.address, await usdc.getAddress());
      expect(account.borrowed).to.equal(borrowAmount);
    });

    it("Should revert if amount is 0", async function () {
      await expect(lendingPool.connect(user1).borrow(await usdc.getAddress(), 0))
        .to.be.revertedWith("Invalid amount");
    });

    it("Should update total borrowed", async function () {
      const borrowAmount = ethers.parseUnits("100", 6);
      await lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);

      expect(await lendingPool.totalBorrowed(await usdc.getAddress())).to.equal(borrowAmount);
    });
  });

  describe("Repay", function () {
    beforeEach(async function () {
      // User1 supplies and borrows
      const supplyAmount = ethers.parseUnits("10000", 6);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), supplyAmount);
      await lendingPool.connect(user1).supply(await usdc.getAddress(), supplyAmount);

      await weth.transfer(await lendingPool.getAddress(), ethers.parseEther("10"));

      const borrowAmount = ethers.parseUnits("100", 6);
      await lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);
    });

    it("Should allow users to repay borrowed tokens", async function () {
      const repayAmount = ethers.parseUnits("50", 6);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), repayAmount);

      await expect(lendingPool.connect(user1).repay(await usdc.getAddress(), repayAmount))
        .to.emit(lendingPool, "Repay")
        .withArgs(user1.address, await usdc.getAddress(), repayAmount);

      const account = await lendingPool.getUserAccount(user1.address, await usdc.getAddress());
      expect(account.borrowed).to.equal(ethers.parseUnits("50", 6));
    });

    it("Should revert if repaying more than borrowed", async function () {
      await usdc.connect(user1).approve(await lendingPool.getAddress(), ethers.parseUnits("200", 6));
      
      await expect(lendingPool.connect(user1).repay(await usdc.getAddress(), ethers.parseUnits("200", 6)))
        .to.be.revertedWith("Repay amount exceeds debt");
    });

    it("Should update total borrowed", async function () {
      const repayAmount = ethers.parseUnits("50", 6);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), repayAmount);
      await lendingPool.connect(user1).repay(await usdc.getAddress(), repayAmount);

      expect(await lendingPool.totalBorrowed(await usdc.getAddress())).to.equal(ethers.parseUnits("50", 6));
    });
  });

  describe("Account Info", function () {
    it("Should return correct account details", async function () {
      const supplyAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), supplyAmount);
      await lendingPool.connect(user1).supply(await usdc.getAddress(), supplyAmount);

      const account = await lendingPool.getUserAccount(user1.address, await usdc.getAddress());
      
      expect(account.supplied).to.equal(supplyAmount);
      expect(account.borrowed).to.equal(0);
      expect(account.lastUpdateTime).to.be.greaterThan(0);
    });
  });
});

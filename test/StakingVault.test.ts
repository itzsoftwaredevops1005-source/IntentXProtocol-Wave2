import { expect } from "chai";
import { ethers } from "hardhat";
import { StakingVault, MockERC20 } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("StakingVault", function () {
  let vault: StakingVault;
  let stakingToken: MockERC20;
  let rewardToken: MockERC20;
  let owner, user1, user2;

  const REWARD_RATE = ethers.parseEther("0.0001"); // 0.0001 tokens per second

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    stakingToken = await MockERC20Factory.deploy("Staking Token", "STK", ethers.parseEther("10000"), 18);
    rewardToken = await MockERC20Factory.deploy("Reward Token", "RWD", ethers.parseEther("10000"), 18);

    const StakingVaultFactory = await ethers.getContractFactory("StakingVault");
    vault = await StakingVaultFactory.deploy(
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      REWARD_RATE
    );

    // Fund vault with reward tokens
    await rewardToken.transfer(await vault.getAddress(), ethers.parseEther("1000"));

    // Give users staking tokens
    await stakingToken.transfer(user1.address, ethers.parseEther("1000"));
    await stakingToken.transfer(user2.address, ethers.parseEther("1000"));
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(await vault.getAddress(), stakeAmount);
      
      await expect(vault.connect(user1).stake(stakeAmount))
        .to.emit(vault, "Staked")
        .withArgs(user1.address, stakeAmount);

      const [staked] = await vault.getUserInfo(user1.address);
      expect(staked).to.equal(stakeAmount);
    });

    it("Should update total staked", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(await vault.getAddress(), stakeAmount);
      await vault.connect(user1).stake(stakeAmount);

      expect(await vault.totalStaked()).to.equal(stakeAmount);
    });

    it("Should revert if staking 0", async function () {
      await expect(vault.connect(user1).stake(0))
        .to.be.revertedWith("Cannot stake 0");
    });
  });

  describe("Withdrawing", function () {
    beforeEach(async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(await vault.getAddress(), stakeAmount);
      await vault.connect(user1).stake(stakeAmount);
    });

    it("Should allow users to withdraw staked tokens", async function () {
      const withdrawAmount = ethers.parseEther("50");
      
      await expect(vault.connect(user1).withdraw(withdrawAmount))
        .to.emit(vault, "Withdrawn")
        .withArgs(user1.address, withdrawAmount);

      const [staked] = await vault.getUserInfo(user1.address);
      expect(staked).to.equal(ethers.parseEther("50"));
    });

    it("Should revert if withdrawing more than staked", async function () {
      await expect(vault.connect(user1).withdraw(ethers.parseEther("200")))
        .to.be.revertedWith("Insufficient staked balance");
    });

    it("Should revert if withdrawing 0", async function () {
      await expect(vault.connect(user1).withdraw(0))
        .to.be.revertedWith("Cannot withdraw 0");
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(await vault.getAddress(), stakeAmount);
      await vault.connect(user1).stake(stakeAmount);
    });

    it("Should accumulate rewards over time", async function () {
      await time.increase(3600); // 1 hour

      const [, earned] = await vault.getUserInfo(user1.address);
      expect(earned).to.be.greaterThan(0);
    });

    it("Should allow users to claim rewards", async function () {
      await time.increase(3600);

      const balanceBefore = await rewardToken.balanceOf(user1.address);
      await vault.connect(user1).claimRewards();
      const balanceAfter = await rewardToken.balanceOf(user1.address);

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should reset rewards after claiming", async function () {
      await time.increase(3600);
      await vault.connect(user1).claimRewards();

      const rewards = await vault.rewards(user1.address);
      expect(rewards).to.equal(0);
    });
  });

  describe("Exit", function () {
    beforeEach(async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(await vault.getAddress(), stakeAmount);
      await vault.connect(user1).stake(stakeAmount);
      await time.increase(3600);
    });

    it("Should withdraw all and claim rewards", async function () {
      const stakingBalanceBefore = await stakingToken.balanceOf(user1.address);
      const rewardBalanceBefore = await rewardToken.balanceOf(user1.address);

      await vault.connect(user1).exit();

      const stakingBalanceAfter = await stakingToken.balanceOf(user1.address);
      const rewardBalanceAfter = await rewardToken.balanceOf(user1.address);

      expect(stakingBalanceAfter).to.be.greaterThan(stakingBalanceBefore);
      expect(rewardBalanceAfter).to.be.greaterThan(rewardBalanceBefore);

      const [staked] = await vault.getUserInfo(user1.address);
      expect(staked).to.equal(0);
    });
  });

  describe("Reward Rate", function () {
    it("Should update reward rate", async function () {
      const newRate = ethers.parseEther("0.0002");
      
      await expect(vault.setRewardRate(newRate))
        .to.emit(vault, "RewardRateUpdated")
        .withArgs(newRate);

      expect(await vault.rewardRate()).to.equal(newRate);
    });
  });
});

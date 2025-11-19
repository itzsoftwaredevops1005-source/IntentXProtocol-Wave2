import { expect } from "chai";
import { ethers } from "hardhat";
import { IntentRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("IntentRegistry", function () {
  let registry: IntentRegistry;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const IntentRegistryFactory = await ethers.getContractFactory("IntentRegistry");
    registry = await IntentRegistryFactory.deploy();
    await registry.waitForDeployment();
  });

  describe("Intent Registration", function () {
    it("Should register a new intent successfully", async function () {
      const naturalLanguage = "Swap 100 USDC for ETH";
      const parsedData = ethers.toUtf8Bytes("{}");
      const gasEstimate = ethers.parseUnits("0.005", "ether");

      const tx = await registry.connect(user1).registerIntent(naturalLanguage, parsedData, gasEstimate);
      await expect(tx).to.emit(registry, "IntentRegistered");

      const count = await registry.getIntentCount();
      expect(count).to.equal(1);
    });

    it("Should store intent data correctly", async function () {
      const naturalLanguage = "Stake 50 ETH in Lido";
      const parsedData = ethers.toUtf8Bytes("{}");
      const gasEstimate = ethers.parseUnits("0.003", "ether");

      const tx = await registry.connect(user1).registerIntent(naturalLanguage, parsedData, gasEstimate);
      const receipt = await tx.wait();

      const userIntents = await registry.getUserIntents(user1.address);
      expect(userIntents.length).to.equal(1);

      const intent = await registry.getIntent(userIntents[0]);
      expect(intent.user).to.equal(user1.address);
      expect(intent.naturalLanguage).to.equal(naturalLanguage);
      expect(intent.status).to.equal(1); // Parsed status
      expect(intent.gasEstimate).to.equal(gasEstimate);
    });

    it("Should track multiple intents per user", async function () {
      await registry.connect(user1).registerIntent("Intent 1", "0x", 1000);
      await registry.connect(user1).registerIntent("Intent 2", "0x", 2000);

      const userIntents = await registry.getUserIntents(user1.address);
      expect(userIntents.length).to.equal(2);
    });

    it("Should separate intents by user", async function () {
      await registry.connect(user1).registerIntent("User 1 Intent", "0x", 1000);
      await registry.connect(user2).registerIntent("User 2 Intent", "0x", 2000);

      const user1Intents = await registry.getUserIntents(user1.address);
      const user2Intents = await registry.getUserIntents(user2.address);

      expect(user1Intents.length).to.equal(1);
      expect(user2Intents.length).to.equal(1);
      expect(user1Intents[0]).to.not.equal(user2Intents[0]);
    });
  });

  describe("Intent Status Updates", function () {
    let intentId: string;

    beforeEach(async function () {
      const tx = await registry.connect(user1).registerIntent("Test Intent", "0x", 1000);
      const userIntents = await registry.getUserIntents(user1.address);
      intentId = userIntents[0];
    });

    it("Should update intent status", async function () {
      await registry.connect(user1).updateIntentStatus(intentId, 2); // Executing
      const intent = await registry.getIntent(intentId);
      expect(intent.status).to.equal(2);
    });

    it("Should set executedAt timestamp when status is Completed", async function () {
      await registry.connect(user1).updateIntentStatus(intentId, 3); // Completed
      const intent = await registry.getIntent(intentId);
      expect(intent.executedAt).to.be.greaterThan(0);
    });

    it("Should emit IntentStatusUpdated event", async function () {
      await expect(registry.connect(user1).updateIntentStatus(intentId, 2))
        .to.emit(registry, "IntentStatusUpdated")
        .withArgs(intentId, 2);
    });

    it("Should revert if intent does not exist", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        registry.connect(user1).updateIntentStatus(fakeId, 2)
      ).to.be.revertedWith("Intent does not exist");
    });

    it("Should revert if unauthorized user tries to update", async function () {
      await expect(
        registry.connect(user2).updateIntentStatus(intentId, 2)
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("Mark Intent Executed", function () {
    let intentId: string;

    beforeEach(async function () {
      const tx = await registry.connect(user1).registerIntent("Test Intent", "0x", 1000);
      const userIntents = await registry.getUserIntents(user1.address);
      intentId = userIntents[0];
    });

    it("Should mark intent as executed", async function () {
      await registry.markIntentExecuted(intentId);
      const intent = await registry.getIntent(intentId);
      expect(intent.status).to.equal(3); // Completed
      expect(intent.executedAt).to.be.greaterThan(0);
    });

    it("Should emit IntentExecuted event", async function () {
      await expect(registry.markIntentExecuted(intentId))
        .to.emit(registry, "IntentExecuted");
    });
  });

  describe("Query Functions", function () {
    it("Should return correct intent count", async function () {
      expect(await registry.getIntentCount()).to.equal(0);
      await registry.connect(user1).registerIntent("Intent 1", "0x", 1000);
      expect(await registry.getIntentCount()).to.equal(1);
      await registry.connect(user2).registerIntent("Intent 2", "0x", 2000);
      expect(await registry.getIntentCount()).to.equal(2);
    });

    it("Should return empty array for user with no intents", async function () {
      const intents = await registry.getUserIntents(user1.address);
      expect(intents.length).to.equal(0);
    });
  });
});

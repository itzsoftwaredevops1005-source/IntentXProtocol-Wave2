// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IntentRegistry.sol";
import "./mocks/MockPair.sol";
import "./mocks/MockRouter.sol";

/**
 * @title ExecutionManager
 * @notice Handles execution of parsed intents through DeFi protocol interactions
 * @dev Orchestrates swaps, staking, lending actions based on intent data
 */
contract ExecutionManager {
    IntentRegistry public registry;
    MockRouter public router;
    
    enum ActionType { Swap, Stake, Supply, Borrow, Withdraw, Unstake }
    
    struct ExecutionStep {
        ActionType actionType;
        address protocol;
        address tokenIn;
        address tokenOut;
        uint256 amount;
    }
    
    // Events
    event IntentExecutionStarted(bytes32 indexed intentId);
    event IntentExecutionCompleted(bytes32 indexed intentId, uint256 gasUsed);
    event IntentExecutionFailed(bytes32 indexed intentId, string reason);
    event StepExecuted(bytes32 indexed intentId, uint256 stepIndex, ActionType actionType);
    
    constructor(address _registry, address _router) {
        registry = IntentRegistry(_registry);
        router = MockRouter(_router);
    }
    
    /**
     * @notice Execute a registered intent
     * @param intentId The intent identifier
     * @param steps Array of execution steps
     */
    function executeIntent(
        bytes32 intentId,
        ExecutionStep[] memory steps
    ) external returns (bool) {
        IntentRegistry.Intent memory intent = registry.getIntent(intentId);
        require(intent.user != address(0), "Intent does not exist");
        require(intent.status == IntentRegistry.IntentStatus.Parsed, "Intent not ready for execution");
        
        emit IntentExecutionStarted(intentId);
        
        uint256 gasStart = gasleft();
        
        try this.executeSteps(intentId, steps) {
            uint256 gasUsed = gasStart - gasleft();
            registry.markIntentExecuted(intentId);
            emit IntentExecutionCompleted(intentId, gasUsed);
            return true;
        } catch Error(string memory reason) {
            registry.updateIntentStatus(intentId, IntentRegistry.IntentStatus.Failed);
            emit IntentExecutionFailed(intentId, reason);
            return false;
        }
    }
    
    /**
     * @notice Execute individual steps of an intent
     * @param intentId The intent identifier
     * @param steps Array of execution steps
     */
    function executeSteps(
        bytes32 intentId,
        ExecutionStep[] memory steps
    ) external {
        require(msg.sender == address(this), "Can only be called internally");
        
        for (uint256 i = 0; i < steps.length; i++) {
            ExecutionStep memory step = steps[i];
            
            if (step.actionType == ActionType.Swap) {
                executeSwap(step);
            } else if (step.actionType == ActionType.Stake) {
                executeStake(step);
            } else if (step.actionType == ActionType.Supply) {
                executeSupply(step);
            } else if (step.actionType == ActionType.Borrow) {
                executeBorrow(step);
            }
            
            emit StepExecuted(intentId, i, step.actionType);
        }
    }
    
    /**
     * @notice Execute a swap operation
     * @param step The execution step
     */
    function executeSwap(ExecutionStep memory step) internal {
        address[] memory path = new address[](2);
        path[0] = step.tokenIn;
        path[1] = step.tokenOut;
        
        // In production, this would approve and call the actual DEX router
        router.swapExactTokensForTokens(
            step.amount,
            0, // amountOutMin (simplified for mock)
            path,
            msg.sender,
            block.timestamp + 300
        );
    }
    
    /**
     * @notice Execute a staking operation
     * @param step The execution step
     */
    function executeStake(ExecutionStep memory step) internal {
        // Mock staking implementation
        // In production, this would interact with actual staking contracts
        require(step.amount > 0, "Invalid stake amount");
    }
    
    /**
     * @notice Execute a supply (lending) operation
     * @param step The execution step
     */
    function executeSupply(ExecutionStep memory step) internal {
        // Mock lending supply
        // In production, this would interact with Aave, Compound, etc.
        require(step.amount > 0, "Invalid supply amount");
    }
    
    /**
     * @notice Execute a borrow operation
     * @param step The execution step
     */
    function executeBorrow(ExecutionStep memory step) internal {
        // Mock borrow implementation
        require(step.amount > 0, "Invalid borrow amount");
    }
    
    /**
     * @notice Estimate gas for intent execution
     * @param steps Array of execution steps
     * @return Estimated gas cost
     */
    function estimateGas(ExecutionStep[] memory steps) external pure returns (uint256) {
        // Simplified gas estimation
        uint256 baseGas = 21000;
        uint256 perStepGas = 100000;
        return baseGas + (steps.length * perStepGas);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IntentRegistry
 * @notice Core registry for user intents in the IntentX protocol
 * @dev Stores intent metadata, tracks status, and enables intent discovery
 */
contract IntentRegistry {
    enum IntentStatus { Pending, Parsed, Executing, Completed, Failed, Cancelled }
    
    struct Intent {
        address user;
        bytes32 intentHash;
        string naturalLanguage;
        bytes parsedData;
        IntentStatus status;
        uint256 createdAt;
        uint256 executedAt;
        uint256 gasEstimate;
    }
    
    // Intent storage
    mapping(bytes32 => Intent) public intents;
    mapping(address => bytes32[]) public userIntents;
    bytes32[] public allIntentIds;
    
    // Events
    event IntentRegistered(bytes32 indexed intentId, address indexed user, string naturalLanguage);
    event IntentStatusUpdated(bytes32 indexed intentId, IntentStatus status);
    event IntentExecuted(bytes32 indexed intentId, address indexed executor);
    
    /**
     * @notice Register a new user intent
     * @param naturalLanguage The natural language description of the intent
     * @param parsedData The parsed data structure (encoded)
     * @param gasEstimate Estimated gas cost for execution
     * @return intentId The unique identifier for the intent
     */
    function registerIntent(
        string memory naturalLanguage,
        bytes memory parsedData,
        uint256 gasEstimate
    ) external returns (bytes32) {
        bytes32 intentId = keccak256(
            abi.encodePacked(msg.sender, naturalLanguage, block.timestamp, allIntentIds.length)
        );
        
        intents[intentId] = Intent({
            user: msg.sender,
            intentHash: intentId,
            naturalLanguage: naturalLanguage,
            parsedData: parsedData,
            status: IntentStatus.Parsed,
            createdAt: block.timestamp,
            executedAt: 0,
            gasEstimate: gasEstimate
        });
        
        userIntents[msg.sender].push(intentId);
        allIntentIds.push(intentId);
        
        emit IntentRegistered(intentId, msg.sender, naturalLanguage);
        
        return intentId;
    }
    
    /**
     * @notice Update the status of an intent
     * @param intentId The intent identifier
     * @param newStatus The new status
     */
    function updateIntentStatus(bytes32 intentId, IntentStatus newStatus) external {
        Intent storage intent = intents[intentId];
        require(intent.user != address(0), "Intent does not exist");
        require(msg.sender == intent.user || msg.sender == address(this), "Unauthorized");
        
        intent.status = newStatus;
        if (newStatus == IntentStatus.Completed || newStatus == IntentStatus.Failed) {
            intent.executedAt = block.timestamp;
        }
        
        emit IntentStatusUpdated(intentId, newStatus);
    }
    
    /**
     * @notice Mark intent as executed
     * @param intentId The intent identifier
     */
    function markIntentExecuted(bytes32 intentId) external {
        Intent storage intent = intents[intentId];
        require(intent.user != address(0), "Intent does not exist");
        
        intent.status = IntentStatus.Completed;
        intent.executedAt = block.timestamp;
        
        emit IntentExecuted(intentId, msg.sender);
        emit IntentStatusUpdated(intentId, IntentStatus.Completed);
    }
    
    /**
     * @notice Get all intents for a user
     * @param user The user address
     * @return Array of intent IDs
     */
    function getUserIntents(address user) external view returns (bytes32[] memory) {
        return userIntents[user];
    }
    
    /**
     * @notice Get total number of intents
     * @return The count of all intents
     */
    function getIntentCount() external view returns (uint256) {
        return allIntentIds.length;
    }
    
    /**
     * @notice Get intent details
     * @param intentId The intent identifier
     * @return The intent struct
     */
    function getIntent(bytes32 intentId) external view returns (Intent memory) {
        return intents[intentId];
    }
}

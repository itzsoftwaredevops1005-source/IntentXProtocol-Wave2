// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LendingPoolMock
 * @notice Mock lending pool (Aave/Compound style) for testing
 * @dev Simplified lending protocol for supply, borrow, repay operations
 */
contract LendingPoolMock {
    struct UserAccount {
        uint256 supplied;
        uint256 borrowed;
        uint256 lastUpdateTime;
    }
    
    mapping(address => mapping(address => UserAccount)) public accounts;
    mapping(address => uint256) public totalSupplied;
    mapping(address => uint256) public totalBorrowed;
    
    // Interest rates (APY in basis points)
    uint256 public constant SUPPLY_RATE = 300; // 3% APY
    uint256 public constant BORROW_RATE = 800; // 8% APY
    uint256 public constant COLLATERAL_FACTOR = 7500; // 75% LTV
    
    event Supply(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event Borrow(address indexed user, address indexed token, uint256 amount);
    event Repay(address indexed user, address indexed token, uint256 amount);
    
    /**
     * @notice Supply tokens to the lending pool
     * @param token Token address
     * @param amount Amount to supply
     */
    function supply(address token, uint256 amount) external {
        require(amount > 0, "Invalid amount");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        UserAccount storage account = accounts[msg.sender][token];
        account.supplied += amount;
        account.lastUpdateTime = block.timestamp;
        
        totalSupplied[token] += amount;
        
        emit Supply(msg.sender, token, amount);
    }
    
    /**
     * @notice Withdraw supplied tokens
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function withdraw(address token, uint256 amount) external {
        UserAccount storage account = accounts[msg.sender][token];
        require(account.supplied >= amount, "Insufficient supplied balance");
        
        account.supplied -= amount;
        account.lastUpdateTime = block.timestamp;
        
        totalSupplied[token] -= amount;
        
        IERC20(token).transfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, token, amount);
    }
    
    /**
     * @notice Borrow tokens against collateral
     * @param token Token address
     * @param amount Amount to borrow
     */
    function borrow(address token, uint256 amount) external {
        require(amount > 0, "Invalid amount");
        
        uint256 collateralValue = getCollateralValue(msg.sender);
        uint256 borrowedValue = getBorrowedValue(msg.sender) + amount;
        
        require(
            borrowedValue * 10000 <= collateralValue * COLLATERAL_FACTOR,
            "Insufficient collateral"
        );
        
        UserAccount storage account = accounts[msg.sender][token];
        account.borrowed += amount;
        account.lastUpdateTime = block.timestamp;
        
        totalBorrowed[token] += amount;
        
        IERC20(token).transfer(msg.sender, amount);
        
        emit Borrow(msg.sender, token, amount);
    }
    
    /**
     * @notice Repay borrowed tokens
     * @param token Token address
     * @param amount Amount to repay
     */
    function repay(address token, uint256 amount) external {
        UserAccount storage account = accounts[msg.sender][token];
        require(account.borrowed >= amount, "Repay amount exceeds debt");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        account.borrowed -= amount;
        account.lastUpdateTime = block.timestamp;
        
        totalBorrowed[token] -= amount;
        
        emit Repay(msg.sender, token, amount);
    }
    
    /**
     * @notice Get user's collateral value (simplified)
     * @param user User address
     * @return Total collateral value
     */
    function getCollateralValue(address user) public view returns (uint256) {
        // Simplified: return supplied amount (in production, would convert to USD)
        return accounts[user][address(0)].supplied;
    }
    
    /**
     * @notice Get user's borrowed value (simplified)
     * @param user User address
     * @return Total borrowed value
     */
    function getBorrowedValue(address user) public view returns (uint256) {
        // Simplified: return borrowed amount
        return accounts[user][address(0)].borrowed;
    }
    
    /**
     * @notice Get user account details
     * @param user User address
     * @param token Token address
     * @return Account details
     */
    function getUserAccount(address user, address token) external view returns (UserAccount memory) {
        return accounts[user][token];
    }
}

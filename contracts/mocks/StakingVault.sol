// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title StakingVault
 * @notice Simple staking vault with rewards distribution
 * @dev Users can stake tokens and earn rewards over time
 */
contract StakingVault {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;
    
    uint256 public rewardRate; // Rewards per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public userStaked;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    uint256 public totalStaked;
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);
    
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate
    ) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @notice Update reward state
     */
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }
    
    /**
     * @notice Calculate reward per token
     * @return Reward per token value
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        
        return rewardPerTokenStored + 
            ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked;
    }
    
    /**
     * @notice Calculate earned rewards for an account
     * @param account User address
     * @return Amount of rewards earned
     */
    function earned(address account) public view returns (uint256) {
        return (userStaked[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 
            + rewards[account];
    }
    
    /**
     * @notice Stake tokens
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        
        totalStaked += amount;
        userStaked[msg.sender] += amount;
        
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Withdraw staked tokens
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(userStaked[msg.sender] >= amount, "Insufficient staked balance");
        
        totalStaked -= amount;
        userStaked[msg.sender] -= amount;
        
        stakingToken.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }
    
    /**
     * @notice Exit: withdraw all staked tokens and claim rewards
     */
    function exit() external {
        withdraw(userStaked[msg.sender]);
        claimRewards();
    }
    
    /**
     * @notice Update reward rate (owner only in production)
     * @param newRate New reward rate
     */
    function setRewardRate(uint256 newRate) external updateReward(address(0)) {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }
    
    /**
     * @notice Get user staking info
     * @param account User address
     * @return staked Amount staked
     * @return earnedRewards Rewards earned
     */
    function getUserInfo(address account) external view returns (
        uint256 staked,
        uint256 earnedRewards
    ) {
        return (userStaked[account], earned(account));
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockPair
 * @notice Mock Uniswap V2-style liquidity pair for testing
 * @dev Simplified DEX pair implementation for Intent execution simulation
 */
contract MockPair is ERC20 {
    address public token0;
    address public token1;
    
    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;
    
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    
    event Sync(uint112 reserve0, uint112 reserve1);
    
    constructor(address _token0, address _token1) ERC20("Mock LP Token", "MOCK-LP") {
        token0 = _token0;
        token1 = _token1;
    }
    
    /**
     * @notice Initialize liquidity pool with reserves
     * @param amount0 Initial reserve for token0
     * @param amount1 Initial reserve for token1
     */
    function initialize(uint256 amount0, uint256 amount1) external {
        require(reserve0 == 0 && reserve1 == 0, "Already initialized");
        reserve0 = uint112(amount0);
        reserve1 = uint112(amount1);
        blockTimestampLast = uint32(block.timestamp % 2**32);
    }
    
    /**
     * @notice Execute a token swap
     * @param amount0Out Amount of token0 to send
     * @param amount1Out Amount of token1 to send
     * @param to Recipient address
     */
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to
    ) external {
        require(amount0Out > 0 || amount1Out > 0, "Insufficient output amount");
        require(amount0Out < reserve0 && amount1Out < reserve1, "Insufficient liquidity");
        
        // Simplified swap logic for testing
        if (amount0Out > 0) {
            reserve0 = reserve0 - uint112(amount0Out);
            reserve1 = reserve1 + uint112(amount1Out * 997 / 1000); // 0.3% fee
        } else {
            reserve1 = reserve1 - uint112(amount1Out);
            reserve0 = reserve0 + uint112(amount0Out * 997 / 1000); // 0.3% fee
        }
        
        emit Swap(msg.sender, 0, 0, amount0Out, amount1Out, to);
        emit Sync(reserve0, reserve1);
    }
    
    /**
     * @notice Get current reserves
     * @return _reserve0 Reserve of token0
     * @return _reserve1 Reserve of token1
     * @return _blockTimestampLast Last block timestamp
     */
    function getReserves() external view returns (
        uint112 _reserve0,
        uint112 _reserve1,
        uint32 _blockTimestampLast
    ) {
        return (reserve0, reserve1, blockTimestampLast);
    }
    
    /**
     * @notice Calculate output amount for a given input
     * @param amountIn Input amount
     * @param reserveIn Input token reserve
     * @param reserveOut Output token reserve
     * @return amountOut Output amount
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) external pure returns (uint256 amountOut) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }
}

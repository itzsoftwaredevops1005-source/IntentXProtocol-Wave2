// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MockPair.sol";

/**
 * @title MockRouter
 * @notice Mock Uniswap V2-style router for testing intent execution
 * @dev Handles swap routing and liquidity operations
 */
contract MockRouter {
    mapping(address => mapping(address => address)) public getPair;
    
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    /**
     * @notice Create a new pair for two tokens
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair The pair address
     */
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(getPair[tokenA][tokenB] == address(0), "Pair already exists");
        
        MockPair newPair = new MockPair(tokenA, tokenB);
        pair = address(newPair);
        
        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair;
        
        return pair;
    }
    
    /**
     * @notice Swap exact tokens for tokens
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum output amount
     * @param path Array of token addresses representing the swap path
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amounts Array of amounts for each swap
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Transaction expired");
        require(path.length >= 2, "Invalid path");
        
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        for (uint256 i = 0; i < path.length - 1; i++) {
            address pair = getPair[path[i]][path[i + 1]];
            require(pair != address(0), "Pair does not exist");
            
            MockPair pairContract = MockPair(pair);
            (uint112 reserve0, uint112 reserve1,) = pairContract.getReserves();
            
            // Calculate output amount (simplified)
            uint256 amountOut = pairContract.getAmountOut(
                amounts[i],
                uint256(reserve0),
                uint256(reserve1)
            );
            
            amounts[i + 1] = amountOut;
        }
        
        require(amounts[path.length - 1] >= amountOutMin, "Insufficient output amount");
        
        emit Swap(msg.sender, path[0], path[path.length - 1], amountIn, amounts[path.length - 1]);
        
        return amounts;
    }
    
    /**
     * @notice Get amounts out for a given input
     * @param amountIn Input amount
     * @param path Swap path
     * @return amounts Output amounts for each step
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        for (uint256 i = 0; i < path.length - 1; i++) {
            address pair = getPair[path[i]][path[i + 1]];
            if (pair != address(0)) {
                MockPair pairContract = MockPair(pair);
                (uint112 reserve0, uint112 reserve1,) = pairContract.getReserves();
                
                amounts[i + 1] = pairContract.getAmountOut(
                    amounts[i],
                    uint256(reserve0),
                    uint256(reserve1)
                );
            }
        }
        
        return amounts;
    }
}

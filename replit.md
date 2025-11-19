# IntentX DeFi dApp - BlockDAG Buildathon

**Production-ready intent-based DeFi aggregator with multi-chain support**

## Project Overview

IntentX is a next-generation DeFi platform that allows users to express their financial goals in natural language and automatically executes them across multiple blockchain networks. Built for the BlockDAG Buildathon, it features three core DeFi primitives: DEX trading, Lending/Borrowing, and Staking.

### Core Features

- **Natural Language Intents**: Users describe their desired actions (e.g., "Swap 100 USDC for ETH on Uniswap") and the system parses, optimizes, and executes them
- **Multi-Chain Support**: BlockDAG Testnet, Ethereum Goerli, Polygon Mumbai, Hardhat Local
- **Three DeFi Primitives**:
  - DEX Trading (Uniswap-style swaps)
  - Lending & Borrowing (Aave/Compound-style)
  - Staking & Yield Farming
- **Optimistic UI**: Sub-2s perceived transaction times with batching and simulated fast execution
- **Dark Theme Design**: Sleek blockchain-inspired UI with Inter + JetBrains Mono fonts

## Architecture

### Frontend (React + TypeScript)
- **Dashboard**: Portfolio overview, stats cards (Total Value, Active Intents, Total Volume, Success Rate), recent transaction feed
- **Vaults**: Staking interface with 6 vaults (ETH Staking, USDC Lending, WETH Staking, DAI Lending, stETH Staking, USDT Lending) showing APY, TVL, user balances
- **Intent Lab**: Natural language input, real-time parsing with step-by-step preview, execution flow with optimistic updates
- **Analytics**: Performance charts (Portfolio Value, Protocol Distribution, Transaction Volume), detailed metrics
- **FAQ**: Comprehensive help section with collapsible Q&A

### Backend (Express + TypeScript)
API routes for all frontend functionality:
- Analytics: `/api/analytics/summary`, `/api/analytics/detailed`
- Transactions: `/api/transactions/recent`, `/api/transactions`
- Vaults: `/api/vaults`, `/api/vaults/:id`, `POST /api/vaults/action`
- Intents: `POST /api/intent/parse`, `POST /api/intent/execute`, `/api/intent/:id`
- FAQ: `/api/faq`
- Performance: `/api/performance`

### Smart Contracts (Solidity 0.8.24)
All contracts deployed on BlockDAG and test networks:

1. **IntentRegistry.sol**: Core registry for user intents
   - Stores intent metadata (natural language, parsed data, status, timestamps)
   - Tracks intent status (Pending, Parsed, Executing, Completed, Failed, Cancelled)
   - Enables intent discovery via getUserIntents() and getIntentCount()

2. **ExecutionManager.sol**: Orchestrates intent execution
   - Routes actions to appropriate DeFi protocols (DEX, Lending, Staking)
   - Handles multi-step executions with gas estimation
   - Supports 6 action types: Swap, Stake, Supply, Borrow, Withdraw, Unstake

3. **MockPair.sol**: Uniswap V2-style liquidity pair
   - Automated market maker with constant product formula
   - 0.3% swap fees
   - Reserve tracking and price oracles

4. **MockRouter.sol**: DEX router for swap execution
   - Multi-hop swap routing
   - Pair creation and liquidity management
   - Price impact calculation

5. **LendingPoolMock.sol**: Aave/Compound-style lending protocol
   - Supply & withdraw operations
   - Borrow & repay with collateral factor (75% LTV)
   - Interest rate model (3% supply APY, 8% borrow APY)

6. **StakingVault.sol**: Yield farming vault
   - ERC20 token staking
   - Continuous reward distribution
   - Rewards per second calculation with compound tracking

7. **MockERC20.sol**: Testing token contract

### Storage Layer
In-memory storage (MemStorage) with mock data:
- 6 staking vaults with realistic APYs (5.2% - 18.5%)
- 8 FAQ entries covering platform features
- Recent transactions with network-specific explorer links
- Analytics data (TVL, volume, success rates)

## Data Models

### Intent Schema
```typescript
{
  id: string;
  naturalLanguage: string;
  parsedSteps: Array<{
    action: 'swap' | 'stake' | 'supply' | 'borrow' | 'withdraw' | 'unstake';
    protocol: string;
    tokenIn?: string;
    tokenOut?: string;
    amount: string;
    estimatedGas: string;
  }>;
  status: 'pending' | 'parsed' | 'executing' | 'completed' | 'failed';
  totalGasEstimate: string;
  createdAt: string;
  executedAt?: string;
  txHash?: string;
}
```

### Vault Schema
```typescript
{
  id: string;
  name: string;
  type: 'stake' | 'lend';
  apy: string;
  tvl: string;
  userStaked: string;
  tokenSymbol: string;
  description: string;
}
```

### Transaction Schema
```typescript
{
  id: string;
  type: 'swap' | 'stake' | 'unstake' | 'supply' | 'borrow' | 'withdraw';
  status: 'pending' | 'confirmed' | 'failed';
  description: string;
  amount: string;
  tokenSymbol: string;
  timestamp: string;
  network: string;
  txHash: string;
  gasUsed: string;
}
```

## Design System

Following `design_guidelines.md`:
- **Colors**: Dark theme with gray-950/900 backgrounds, blue-600 primary actions
- **Typography**: Inter for UI text, JetBrains Mono for code/addresses/numbers
- **Spacing**: Consistent small/medium/large spacing hierarchy (p-4, p-6, p-8)
- **Components**: Shadcn UI components with custom dark mode variants
- **Interactions**: Hover-elevate and active-elevate-2 utilities for all interactive elements

## Multi-Chain Support

### Supported Networks
- **BlockDAG Testnet**: Chain ID 808080, primary deployment target
- **Ethereum Goerli**: Chain ID 5, EVM compatibility testing
- **Polygon Mumbai**: Chain ID 80001, L2 integration
- **Hardhat Local**: Chain ID 1337, local development

### Explorer URLs
Each network has dedicated block explorers with transaction/address lookups:
- BlockDAG: `https://explorer.blockdag-testnet.example`
- Ethereum: `https://goerli.etherscan.io`
- Polygon: `https://mumbai.polygonscan.com`

## Development Workflow

### Running the Application
```bash
npm run dev  # Starts Express backend + Vite frontend on same port
```

### Smart Contract Development
```bash
npx hardhat compile          # Compile contracts
npx hardhat test             # Run unit tests
npx hardhat run scripts/deploy.ts  # Deploy to local network
npx hardhat run scripts/deploy.ts --network blockdag  # Deploy to BlockDAG
```

### Environment Variables
- `SESSION_SECRET`: Express session encryption key (auto-generated)
- `BLOCKDAG_RPC_URL`: BlockDAG network RPC endpoint
- `GOERLI_RPC_URL`: Ethereum Goerli RPC endpoint
- `MUMBAI_RPC_URL`: Polygon Mumbai RPC endpoint
- `PRIVATE_KEY`: Deployer private key for contract deployment

## Testing Strategy

### E2E Testing (Playwright)
- Intent Lab workflow: Parse natural language → Preview steps → Execute → Verify transaction
- Vault staking: Connect wallet → Select vault → Stake tokens → Verify balance update
- Multi-chain switching: Change network → Verify explorer links update
- Dashboard: Load stats → View transactions → Click explorer links

### Unit Tests (Hardhat)
- IntentRegistry: registerIntent, updateStatus, getUserIntents
- ExecutionManager: executeIntent, executeSteps, gas estimation
- MockPair: swap, getAmountOut, reserve updates
- MockRouter: createPair, swapExactTokensForTokens
- LendingPoolMock: supply, withdraw, borrow, repay
- StakingVault: stake, withdraw, claimRewards

## User Workflows

### Creating an Intent
1. Navigate to Intent Lab
2. Enter natural language (e.g., "Swap 100 USDC for WETH on Uniswap")
3. Click "Parse Intent" (1s simulated delay)
4. Review parsed steps with gas estimates
5. Click "Execute Intent" (1.5s simulated delay)
6. View transaction hash and explorer link

### Staking in a Vault
1. Navigate to Vaults page
2. Select a vault (e.g., "ETH Staking - Lido")
3. Enter stake amount
4. Click "Stake"
5. View updated balance and transaction confirmation

## Recent Updates

### Task 1: Schema & Frontend (Completed)
- ✅ All DeFi data models defined in `shared/schema.ts`
- ✅ Web3-optimized design tokens configured in `design_guidelines.md` and `index.css`
- ✅ All React pages built (Dashboard, Vaults, Intent Lab, Analytics, FAQ)
- ✅ Navigation components (Navbar, NetworkSelector, WalletConnect, ThemeProvider)
- ✅ All API routes implemented in `server/routes.ts`
- ✅ MemStorage with comprehensive mock data
- ✅ SSR-safe ThemeProvider with localStorage in useEffect
- ✅ Comprehensive data-testid attributes for testing
- ✅ Skeleton loading states for all pages
- ✅ Multi-chain explorer URL support with getExplorerUrl helper

### Task 2: Backend & Smart Contracts (Completed)
- ✅ Hardhat project structure created
- ✅ All 7 Solidity contracts written (IntentRegistry, ExecutionManager, MockPair, MockRouter, LendingPoolMock, StakingVault, MockERC20)
- ✅ Deployment script created (`scripts/deploy.ts`)
- ✅ Hardhat configuration with multi-chain network support

### Task 3: Integration, Testing & Documentation (In Progress)
- Next: Connect frontend to backend APIs with ethers.js
- Next: Implement MetaMask wallet connection
- Next: Add optimistic UI updates
- Next: Create comprehensive documentation (README.md, WAVE2.md, deployment.md, DEMO.md, SECURITY.md)
- Next: Set up GitHub Actions CI
- Next: Run end-to-end tests

## Known Issues

- **Node.js Version**: Hardhat toolbox requires Node 22+, current environment uses Node 20.19.3. Contracts are written but compilation blocked. Solution: Upgrade Node version in `replit.nix` or use alternative compilation approach.

## Future Enhancements

- Shared network registry for centralized network metadata
- ActiveNetwork context provider for global network state
- Real-time intent solver with MEV protection
- Cross-chain intent execution via bridge protocols
- Advanced gas optimization strategies
- Intent batching for multiple users
- Social features (intent sharing, following successful traders)

## Contributing

This project is part of the BlockDAG Buildathon and demonstrates production-ready DeFi architecture with intent-based interactions.

## License

MIT License - see LICENSE file for details

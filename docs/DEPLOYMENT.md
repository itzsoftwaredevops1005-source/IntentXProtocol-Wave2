# IntentX Deployment Guide

## BlockDAG Testnet Deployment

### Prerequisites
- Node.js 22+ (required for Hardhat compilation)
- Hardhat environment configured
- BlockDAG testnet RPC endpoint
- Private key for contract deployer account
- Sufficient BDAG tokens for gas fees

### Network Configuration

Add to `hardhat.config.ts`:

```typescript
const networks = {
  blockdag: {
    url: process.env.BLOCKDAG_RPC_URL || "https://rpc.blockdag-testnet.example",
    accounts: [process.env.PRIVATE_KEY || "0x..."],
    chainId: 808080
  }
};
```

### Contract Deployment

#### 1. Compile Contracts
```bash
npx hardhat compile
```

#### 2. Run Tests (Local)
```bash
npx hardhat test
```

#### 3. Deploy to BlockDAG Testnet

```bash
# Deploy all contracts
npx hardhat run scripts/deploy.ts --network blockdag

# Expected output:
# IntentRegistry deployed to: 0x...
# ExecutionManager deployed to: 0x...
# MockPair deployed to: 0x...
# MockRouter deployed to: 0x...
# LendingPoolMock deployed to: 0x...
# StakingVault deployed to: 0x...
# MockERC20 deployed to: 0x...
```

### Environment Variables

```bash
# .env file
BLOCKDAG_RPC_URL=https://rpc.blockdag-testnet.example
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
SESSION_SECRET=your_session_secret_here
```

### Frontend Configuration

After deployment, update contract addresses in the frontend:

```typescript
// client/src/lib/contracts.ts
export const CONTRACTS = {
  blockdag: {
    intentRegistry: "0x...",
    executionManager: "0x...",
    mockRouter: "0x...",
    lendingPool: "0x...",
    stakingVault: "0x...",
  },
  ethereum: { /* ... */ },
  polygon: { /* ... */ }
};
```

### Verify Deployment

1. **Check contract on BlockDAG Explorer**
   ```
   https://explorer.blockdag-testnet.example/address/0x...
   ```

2. **Test intent submission via API**
   ```bash
   curl -X POST http://localhost:5000/api/intent/parse \
     -H "Content-Type: application/json" \
     -d '{
       "naturalLanguage": "Swap 100 USDC for ETH on Uniswap",
       "network": "blockdag"
     }'
   ```

3. **Test frontend integration**
   - Open app at https://intentx-defi.replit.app
   - Connect MetaMask to BlockDAG testnet
   - Try Intent Lab workflow

## GitHub Actions CI/CD

### Automated Compilation

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Contracts

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22.x]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npx hardhat compile
      - run: npx hardhat test
      - name: Deploy to BlockDAG
        if: github.ref == 'refs/heads/main'
        env:
          BLOCKDAG_RPC_URL: ${{ secrets.BLOCKDAG_RPC_URL }}
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
        run: npx hardhat run scripts/deploy.ts --network blockdag
```

## Contract Addresses Registry

### BlockDAG Testnet (Chain ID: 808080)

| Contract | Address | Verification |
|----------|---------|--------------|
| IntentRegistry | 0x... | [Link](https://explorer.blockdag-testnet.example) |
| ExecutionManager | 0x... | [Link](https://explorer.blockdag-testnet.example) |
| MockPair | 0x... | [Link](https://explorer.blockdag-testnet.example) |
| MockRouter | 0x... | [Link](https://explorer.blockdag-testnet.example) |
| LendingPoolMock | 0x... | [Link](https://explorer.blockdag-testnet.example) |
| StakingVault | 0x... | [Link](https://explorer.blockdag-testnet.example) |
| MockERC20 (USDC) | 0x... | [Link](https://explorer.blockdag-testnet.example) |

### Ethereum Goerli (Chain ID: 5)

*Ready for deployment - follow same process*

### Polygon Mumbai (Chain ID: 80001)

*Ready for deployment - follow same process*

## Troubleshooting

### Compilation Errors
- Ensure Node.js 22+ is installed
- Run `npm install` to update dependencies
- Check Solidity version compatibility: `0.8.24`

### Deployment Failures
- Verify RPC endpoint is accessible
- Check private key has sufficient balance for gas
- Inspect transaction receipt for revert reasons

### Network Connectivity
- Ping RPC endpoint: `curl https://rpc.blockdag-testnet.example`
- Verify chain ID matches hardhat.config.ts
- Check firewall rules if behind corporate network

## Security Checklist

- [ ] Private key never committed to version control
- [ ] RPC endpoints use HTTPS
- [ ] Contract addresses hardcoded after deployment (immutable)
- [ ] Gas parameters reviewed for all transactions
- [ ] Test deployment on local Hardhat before mainnet
- [ ] Contracts audited before production use

# Account Abstraction (ERC-4337) Integration Roadmap

## Phase 2: Advanced Features (Post-MVP)

This document outlines the comprehensive roadmap for integrating Account Abstraction into IntentX DeFi platform.

## Overview

Account Abstraction (AA) enables:
- **Gas Sponsorship**: Platform-sponsored transactions (users pay 0 gas)
- **Intent Batching**: Multiple intents in single transaction
- **Smart Wallets**: Custom wallet logic (daily limits, spending rules, etc.)
- **Social Recovery**: Account recovery via guardians

## Architecture

### Current State (MVP)
```
User → MetaMask → EOA → Smart Contract
```

### Post-AA State
```
User → SimpleAccount (Smart Contract Wallet) → Bundler → EntryPoint → Contracts
                                                   ↓
                                              Paymaster (Gas Sponsorship)
```

## Implementation Phases

### Phase 2.1: EntryPoint & Simple Account (2-3 weeks)

#### Contracts to Deploy
```solidity
// contracts/aa/
├── SimpleAccount.sol          // Basic smart account wallet
├── SimpleAccountFactory.sol   // Account creation factory
├── IntentPaymaster.sol        // Gas sponsorship provider
└── IIntentValidator.sol       // Intent validation rules
```

#### Key Components
1. **EntryPoint (use v0.6.0 from eth-infinitism)**
   - Standard UserOperation processing
   - Core AA infrastructure

2. **SimpleAccount**
   ```solidity
   contract SimpleAccount {
     function executeIntent(Intent memory intent) external;
     function executeBatch(Intent[] memory intents) external;
     function transferOwnership(address newOwner) external;
   }
   ```

3. **IntentPaymaster**
   ```solidity
   contract IntentPaymaster {
     function validatePaymasterUserOp(
       UserOperation calldata userOp,
       bytes32 userOpHash,
       uint256 missingAccountFunds
     ) external returns (bytes memory context);
     
     function postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost);
   }
   ```

#### Testing Checklist
- [ ] Deploy EntryPoint locally
- [ ] Create SimpleAccount via factory
- [ ] Sponsor transaction via Paymaster
- [ ] Validate UserOperation bundling
- [ ] Test intent execution through AA

### Phase 2.2: Bundler Integration (1-2 weeks)

#### Choose Bundler Service
**Recommended: Pimlico** (best SDK, testnet support)

```typescript
// server/bundler/pimlico.ts
import { createPimlico } from "permissionless/clients/pimlico";

const pimlico = createPimlico({
  transport: http(BLOCKDAG_RPC_URL),
  entryPoint: ENTRY_POINT_ADDRESS,
});
```

#### API Routes for Bundler
```typescript
// POST /api/intent/executeViaAA
// Bundles multiple intents into single UserOperation
{
  "intents": [
    { "action": "swap", ... },
    { "action": "stake", ... }
  ],
  "wallet": "0x..."
}

// Returns: UserOperationHash for tracking
```

#### UserOperation Processing Flow
```
1. Client submits intent array
2. SimpleAccount prepares UserOperation
3. Paymaster estimates gas & sponsors
4. Bundler collects UserOperation
5. EntryPoint executes all intents
6. Return single tx hash covering all actions
```

### Phase 2.3: Frontend Integration (1 week)

#### Update UI Flow
```
Intent Lab
├── Select Intents (multiple)
├── Review Gas Sponsorship
│   └── Show "Free" instead of gas cost
├── "Execute Batch" button
└── Single tx hash result
```

#### Components to Update
```typescript
// client/src/pages/intent-lab.tsx
- Add multi-intent selection
- Show gas sponsorship badge
- Update execution flow for batching

// client/src/components/wallet-connect.tsx
- Detect SimpleAccount creation
- Switch from MetaMask to AA wallet
- Handle account recovery UI
```

#### New API Client Method
```typescript
// client/src/lib/queryClient.ts
export async function executeIntentBatch(intents: Intent[]) {
  return fetch('/api/intent/executeBatch', {
    method: 'POST',
    body: JSON.stringify({ intents }),
  });
}
```

### Phase 2.4: MEV Protection & Optimization (1-2 weeks)

#### MEV Prevention Strategies
1. **Private RPC (Flashbots Protect or MEV-blocker)**
   ```typescript
   // Use MEV-aware RPC for all bundler calls
   const mevProtectedRpc = "https://api.mevblocker.io/api/v1/...";
   ```

2. **Intent Encryption (Threshold Encryption)**
   - Encrypt user intent until confirmed in block
   - Use Ferveo threshold encryption scheme

3. **Delay Mechanism**
   - Add 1-2 block delay before execution
   - Prevents front-running attacks

#### Slippage Protection
```typescript
// Add to Intent schema
export interface Intent {
  // ... existing fields
  minOutputAmount?: string;  // For swaps
  maxInputAmount?: string;   // For swaps
  deadline?: number;         // Unix timestamp
}
```

### Phase 2.5: Security Audits (2-3 weeks)

#### Tools & Processes
1. **Slither (Static Analysis)**
   ```bash
   slither contracts/aa/ --json > audit-slither.json
   ```
   - Detect reentrancy, overflow/underflow
   - Gas optimization warnings

2. **Mythril (Symbolic Execution)**
   ```bash
   mythril analyze contracts/aa/*.sol
   ```
   - Deep security analysis
   - Finds complex vulnerabilities

3. **Manual Code Review**
   - AA contract patterns (OpenZeppelin reference)
   - Paymaster validation logic
   - UserOperation batching safety

4. **Test Coverage**
   ```bash
   npx hardhat coverage --solcoverjs .solcover.js
   ```
   - Target: 95%+ coverage
   - All critical paths tested

## Deployment Timeline

| Phase | Duration | Deliverables | Testnet | Mainnet |
|-------|----------|--------------|---------|---------|
| 2.1 | 2-3w | AA contracts, tests | BlockDAG | Ethereum |
| 2.2 | 1-2w | Bundler integration | Pimlico | Pimlico |
| 2.3 | 1w | Frontend AA UI | Live | Live |
| 2.4 | 1-2w | MEV protection | Research | Implementation |
| 2.5 | 2-3w | Security audit | Complete | Certified |
| **Total** | **~8-10w** | **Production AA System** | ✅ | ✅ |

## Success Metrics

- [ ] Gas sponsorship working (users pay 0 gas)
- [ ] Intent batching reduces costs by 50%+ vs individual txs
- [ ] 100% of contracts pass Slither/Mythril audit
- [ ] No failed UserOperations in 1000+ transaction test
- [ ] Sub-1s UserOperation submission to mempool
- [ ] 95%+ test coverage for AA contracts

## Dependencies & Resources

### Smart Contract Libraries
- **eth-infinitism/account-abstraction** - EntryPoint, reference implementations
- **OpenZeppelin/openzeppelin-contracts** - Access control, safe patterns
- **permissionless** - TypeScript AA SDK (client & server)

### Services
- **Pimlico Bundler API** - https://docs.pimlico.io
- **Alchemy Bundler** - Fallback option
- **Flashbots Protect** - MEV protection

### Tooling
- **Slither** - `pip install slither-analyzer`
- **Mythril** - `pip install mythril`
- **Hardhat Coverage** - Built-in

## Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Bundler censorship | Intents blocked | Use multiple bundlers |
| Paymaster drain | Gas sponsor bankrupt | Rate limiting, deposit checks |
| UserOp replay | Transaction reuse | Nonce validation, chainId checks |
| Validator front-run | Wallet hijacking | Signature expiration, time locks |

## Next Steps After MVP

1. **Deploy EntryPoint** to BlockDAG testnet (reference implementation)
2. **Develop SimpleAccount** with full unit test coverage
3. **Integrate Pimlico** bundler with API routes
4. **Update frontend** for multi-intent selection
5. **Run security audits** before mainnet deployment
6. **Build admin dashboard** for gas sponsorship monitoring

## Resources

- [ERC-4337 Spec](https://eips.ethereum.org/EIPS/eip-4337)
- [eth-infinitism Docs](https://github.com/eth-infinitism/account-abstraction)
- [Pimlico Bundler API](https://docs.pimlico.io)
- [Permissionless.js Docs](https://docs.pimlico.io/permissionless)
- [OpenZeppelin AA Contracts](https://docs.openzeppelin.com/contracts/4.x/)

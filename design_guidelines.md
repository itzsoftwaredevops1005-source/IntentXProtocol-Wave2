# IntentX DeFi dApp Design Guidelines

## Design Approach
**Reference-Based DeFi System**: Draw inspiration from leading DeFi protocols (Uniswap, Aave, dYdX) combined with Linear's clean dashboard aesthetics. Prioritize clarity, data density, and transaction confidence.

**Core Principles**:
- Trust through transparency: All transaction states visible
- Information hierarchy: Critical data prominent, supporting details accessible
- Performance perception: Loading states and optimistic updates
- Web3 familiarity: Leverage established DeFi UI patterns

## Dark Theme Specification
**Background Layers**:
- Primary background: `bg-gray-950` (deepest layer)
- Card/panel background: `bg-gray-900` (elevated surfaces)
- Hover states: `bg-gray-800`
- Borders: `border-gray-800`

**Text Hierarchy**:
- Primary text: `text-gray-50` (headings, critical data)
- Secondary text: `text-gray-400` (labels, descriptions)
- Muted text: `text-gray-500` (timestamps, helper text)

**Accent Colors**:
- Primary action: `bg-blue-600` buttons, `text-blue-400` links
- Success: `text-green-400`, `bg-green-900/20` backgrounds
- Warning: `text-amber-400`, `bg-amber-900/20`
- Error: `text-red-400`, `bg-red-900/20`
- Chain indicators: Unique color per network (Ethereum: `text-indigo-400`, Polygon: `text-purple-400`, BlockDAG: `text-cyan-400`)

## Typography
**Font Stack**:
- Primary: Inter (via Google Fonts CDN) - UI text, labels, data
- Monospace: JetBrains Mono - addresses, transaction hashes, numerical values

**Hierarchy**:
- Page titles: `text-3xl font-bold text-gray-50`
- Section headers: `text-xl font-semibold text-gray-50`
- Card titles: `text-lg font-medium text-gray-50`
- Body text: `text-base text-gray-400`
- Data values: `text-lg font-mono text-gray-50`
- Labels: `text-sm font-medium text-gray-500 uppercase tracking-wide`

## Layout System
**Spacing Primitives**: Use Tailwind units of `2, 4, 6, 8, 12, 16` for consistent rhythm
- Component padding: `p-6` for cards, `p-8` for larger containers
- Section gaps: `gap-6` for grids, `gap-4` for form elements
- Vertical spacing: `space-y-8` between major sections

**Grid System**:
- Dashboard: 3-column grid on desktop (`grid-cols-3 gap-6`)
- Data tables: Full-width with responsive overflow
- Intent Lab: 2-column split (input panel left, preview panel right) on desktop, stacked on mobile

## Component Library

### Navigation
**Top Navbar** (`h-16 border-b border-gray-800`):
- Logo left, main navigation center (Dashboard, Vaults, Intent Lab, Analytics)
- Right section: Network selector dropdown, wallet connection button, user menu
- Active state: `border-b-2 border-blue-500` indicator on current page

### Dashboard Cards
**Stat Cards** (3-column grid):
- Icon with gradient background (top-left)
- Large numerical value (`text-3xl font-bold font-mono`)
- Label below value, 24h change indicator (`text-green-400 ↑` or `text-red-400 ↓`)
- Card background: `bg-gray-900 rounded-xl border border-gray-800 p-6`

**Activity Feed**:
- Recent transactions list with status badges
- Each row: icon, description, timestamp, status pill
- Hover: `bg-gray-800` background on row

### Intent Lab Interface
**Intent Input Panel**:
- Large textarea (`bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm`)
- Natural language placeholder: "Swap 100 USDC for ETH on Uniswap"
- Parse button below input (`bg-blue-600 hover:bg-blue-700`)

**Preview Panel**:
- Step-by-step breakdown with numbered badges
- Gas estimate at top, total value at bottom
- Transaction route visualization (horizontal flow with arrows)
- Execute button at bottom (`w-full bg-blue-600`)

### Vaults/Staking
**Vault Cards** (2-column grid):
- Protocol logo/icon top-left
- APY prominently displayed (`text-2xl font-bold text-green-400`)
- TVL and available balance below
- Stake/Unstake buttons in footer
- Risk badge (Low/Medium/High) with corresponding colors

### Data Tables
**Transaction/Position Tables**:
- Sticky header (`sticky top-0 bg-gray-950 z-10`)
- Alternating row backgrounds: transparent, `bg-gray-900/50`
- Monospace font for addresses (truncated with hover tooltip)
- Status badges: pill-shaped with appropriate colors
- Action buttons in rightmost column

### Wallet Connection
**Connect Modal**:
- Centered modal (`max-w-md`) with backdrop blur
- Provider options (MetaMask, WalletConnect) as large clickable cards
- Each card: provider icon, name, "Detected"/"Popular" badge
- Network selector below (dropdown or tabs)

### Forms & Inputs
**Input Fields**:
- Background: `bg-gray-900 border border-gray-700 focus:border-blue-500`
- Label above with helper text below
- Token selector: Input with dropdown (icon + symbol)
- Max button inline right for balance inputs

### Loading States
**Transaction Progress**:
- Stepper component showing: Pending → Simulating → Executing → Confirmed
- Current step highlighted, completed steps checkmark, future steps muted
- Estimated time remaining below
- Spinner icon for active step

### Analytics Page
**Chart Cards**:
- Full-width chart container with controls (timeframe selector)
- Line charts for historical performance (use Chart.js or Recharts)
- Background grid: subtle `stroke-gray-800`
- Chart line: `stroke-blue-500` with gradient fill below

## Images
No hero images required for this application dashboard. Use:
- Protocol/chain logos as icons (32x32px, 48x48px sizes)
- Empty state illustrations for zero-data scenarios (e.g., "No vaults yet")
- Network logos in chain selector (20x20px)

## Animations
Minimal, purposeful animations using Framer Motion:
- Page transitions: Fade + slight slide up (200ms)
- Card hover: Lift effect (`hover:-translate-y-1 transition-transform`)
- Button clicks: Scale down on active (`active:scale-95`)
- Loading spinners: Continuous rotation
- Transaction success: Confetti burst (celebrate-success library)

**Avoid**: Excessive scroll animations, parallax effects, complex transitions

## Responsive Breakpoints
- Mobile (<768px): Single column, stacked navigation (hamburger menu)
- Tablet (768px-1024px): 2-column grids, condensed navbar
- Desktop (>1024px): Full 3-column layouts, expanded navigation

## Accessibility
- All interactive elements: `focus:ring-2 focus:ring-blue-500 focus:outline-none`
- Color contrast: WCAG AA minimum for all text
- Loading states announced to screen readers
- Keyboard navigation: Tab order follows visual flow
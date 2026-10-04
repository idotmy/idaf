# IDAF Protocol 🌐
### Decentralized Web3 Domain NFT Fractionalization & Liquidity Marketplace

![Arbitrum](https://img.shields.io/badge/Network-Arbitrum%20One-blue?style=flat-square&logo=arbitrum)
![Solidity](https://img.shields.io/badge/Solidity-0.8.37-363636?style=flat-square&logo=solidity)
![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20Tailwind%20v4-61DAFB?style=flat-square&logo=react)
![Wagmi](https://img.shields.io/badge/Web3-Wagmi%20%7C%20RainbowKit%20%7C%20Viem-black?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📌 Executive Summary

**IDAF** is a 100% on-chain, trustless protocol built on **Arbitrum One** that allows Web3 Domain NFT owners (such as `.i`, `.bio`, `.eth`, and custom ERC-721 domain names) to fractionalize their domain equity into liquid, standardized ERC-20 tokens at discounted rates.

By bridging the liquidity gap in high-value digital real estate, domain holders can unlock instant upfront liquidity in **USDC** from multiple micro-investors without giving up custody to any centralized entity or relying on off-chain databases.

---

## 🌟 Key Innovations & Features

- 🔒 **Trustless Smart Contract Escrow**: When a listing is created, the domain NFT (ERC-721) is transferred directly into the `IDAFMarket` contract until full buyout, expiry settlement, or cancellation.
- 🪙 **Dynamic ERC-20 Factory**: Every listed domain automatically deploys a bespoke, isolated ERC-20 token (`IDAF-<DOMAIN>`) representing exact pro-rata economic rights to the future sale proceeds.
- ⚡ **Zero Database Dependency**: All states, listing metrics, investor balances, and token prices are computed and read purely from the Arbitrum blockchain in real-time.
- 💰 **Pre-configured Discount & ROI Tiers**: Sellers offer fixed discounts (10%, 20%, 30%, 40%, 50%) providing guaranteed mathematical ROI (from +11.1% to +100.0%) for fractional token investors upon full acquisition.
- 🔄 **Bidirectional Liquidity & Dynamic Redemptions**:
  - **Active Stage**: Investors can purchase fractional tokens or redeem them back for escrowed USDC before the listing expires.
  - **Full Acquisition (Buyout)**: Any buyer can purchase the underlying domain NFT by paying the asking price in USDC.
  - **Pro-Rata Settlement**: Fractional token holders burn their `IDAF` tokens to claim their amplified USDC payout instantly.
  - **Expired / Unsold Protection**: If the domain is not acquired before expiry, investors can claim full refunds, and the seller can retrieve their domain NFT.

---

## 🏗️ Protocol Architecture

```
                                  +-----------------------+
                                  |    Domain NFT Owner   |
                                  +-----------+-----------+
                                              |
                          1. Approve & Escrow | (NFT ERC-721)
                                              v
+------------------+             +-------------------------+             +-------------------+
|  Micro-Investor  | ----------> |      IDAFMarket.sol     | <---------- |  Domain Acquirer  |
+------------------+  2. Buy     |     (Core Orchestrator) |  4. Buyout  +-------------------+
        ^             Tokens     +------------+------------+     (USDC)            |
        |             (USDC)                  |                                | (Receives NFT)
        |                                     | Deploys                        v
        |                                     v                       +-----------------+
        |                          +---------------------+            | Domain Transfer |
        +------------------------- |    IDAFToken.sol    |            +-----------------+
           3. Receives Fractional  | (Dedicated ERC-20)  |
              Tokens (IDAF-DOMAIN) +---------------------+
```

### 1. Smart Contracts
| Contract | Description | Standard |
| :--- | :--- | :--- |
| **`IDAFMarket.sol`** | Core escrow, factory orchestrator, pricing engine, and settlement manager | `IERC721Receiver`, Ownable |
| **`IDAFToken.sol`** | Isolated ERC-20 fractional token dynamically deployed per listing | `ERC-20` (18 Decimals) |

---

## 📊 Economic Mechanics & Settlement Math

### 1. Offering Valuation & Token Price
Each listing mints a fixed supply of **1,000,000 IDAF Tokens** (with 18 decimals).

$$\text{Offering Total (USDC)} = \text{Asking Price} \times \frac{10000 - \text{Discount Bps}}{10000}$$

$$\text{Token Unit Price (USDC)} = \frac{\text{Offering Total}}{1,000,000}$$

### 2. Discount Tiers & Investor Returns
| Discount Tier | Discount (Bps) | Offering Value ($1,000 Asking) | Token Price | Investor ROI upon Sale |
| :--- | :--- | :--- | :--- | :--- |
| **10%** | `1000` | $900 USDC | $0.0009 USDC | **+11.1%** |
| **20%** | `2000` | $800 USDC | $0.0008 USDC | **+25.0%** |
| **30%** | `3000` | $700 USDC | $0.0007 USDC | **+42.8%** |
| **40%** | `4000` | $600 USDC | $0.0006 USDC | **+66.7%** |
| **50%** | `5000` | $500 USDC | $0.0005 USDC | **+100.0%** |

### 3. Settlement Payout Distribution (On Buyout)
When a buyer pays the full $\text{Asking Price}$:
- **Investor Share**: $\text{Investor Share} = \text{Asking Price} \times \frac{\text{Tokens Sold}}{\text{Total Supply}}$
- **Seller Net Proceeds**: $\text{Seller Proceeds} = (\text{Asking Price} - \text{Investor Share}) + \text{Escrowed USDC from token sales}$
- **Per-Token Payout**: $\text{Claim Amount} = \text{Burned Tokens} \times \frac{\text{Asking Price}}{\text{Total Supply}}$

---

## 🚀 Deployed Addresses (Arbitrum One)

| Asset / Contract | Network | Address |
| :--- | :--- | :--- |
| **IDAF Marketplace** | Arbitrum One (`42161`) | [`0x82E02Cf30Cdfb686dCdA48982eDcb754688bfDCa`](https://arbiscan.io/address/0x82E02Cf30Cdfb686dCdA48982eDcb754688bfDCa) |
| **USDC (Native)** | Arbitrum One (`42161`) | [`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`](https://arbiscan.io/token/0xaf88d065e77c8cC2239327C5EDb3A432268e5831) |
| **Domain NFT Contract** | Arbitrum One (`42161`) | [`0xf853F8243F10a57CF5e43A49F156F132c05C21a6`](https://arbiscan.io/address/0xf853F8243F10a57CF5e43A49F156F132c05C21a6) |

---

## 💻 Tech Stack & Architecture

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling & Design System**: [Tailwind CSS v4](https://tailwindcss.com/) with full Dark/Light theme switching
- **Web3 Wallet Stack**: [RainbowKit v2](https://www.rainbowkit.com/), [Wagmi v2](https://wagmi.sh/), [Viem v2](https://viem.sh/)
- **State & Query Management**: [@tanstack/react-query v5](https://tanstack.com/query)
- **Icons & Motion**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)

---

## 📦 Getting Started & Local Development

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm / yarn
- A Web3 Wallet (e.g., MetaMask, Rainbow, Coinbase Wallet) connected to Arbitrum One.

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/idotmy/idaf.git
cd idaf

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The application will be accessible at `http://localhost:3000` (or `http://localhost:5173`).

### Production Build

```bash
# Compile and package for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🧪 Testing

Comprehensive unit and integration test suites are included to verify contract economics, reentrancy protection, and precision arithmetic:

```bash
# Run test suite
npm test
```

---

## 🔐 Security & Safety Features

- **Reentrancy Protection**: All state-modifying functions (`buyTokens`, `redeemTokens`, `buyoutDomain`, `claimSalePayout`, `claimRefund`) utilize non-reentrant mutex guards.
- **Strict Pull-Payment Pattern**: Proceeds and refunds are never pushed in bulk; users explicitly claim payouts to prevent denial-of-service (DoS) via gas limits.
- **Safe ERC-20 & ERC-721 Transfers**: Robust checks on return values for USDC transfers.
- **Integer Math Discipline**: All division operations occur after multiplication to prevent precision loss.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for the decentralized web. Powered by <a href="https://doti.my/">Doti</a>.
</p>

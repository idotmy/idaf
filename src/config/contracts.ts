/**
 * DomainFraction - Unified Single Configuration File
 * 
 * ALL contract addresses, ABIs, chain IDs, discount tiers, and RPCs are centralized here.
 * To change network (e.g. from Arbitrum to Arbitrum One), simply change the active target below.
 */

import { getAddress } from 'viem';

export const APP_CONFIG = {
  version: "1.0.0",
  networkName: "Arbitrum",
  chainId: 42161,
  currencySymbol: "USDC",
  currencyDecimals: 6,
  tokensDecimals: 18,
  totalTokenSupply: 1_000_000,

  // RPC Endpoints
  rpcUrls: [
    "https://arb1.arbitrum.io/rpc",
    "https://arbitrum.llamarpc.com",
    "https://arbitrum-one-rpc.publicnode.com",
    "https://arbitrum.drpc.org",
  ],

  // Block Explorer
  blockExplorerUrl: "https://arbiscan.io",

  // Curated Discount Tiers
  allowedDiscounts: [
    { label: "10% Discount", value: 1000, percentage: 10, investorRoi: 11.1 },
    { label: "20% Discount", value: 2000, percentage: 20, investorRoi: 25.0 },
    { label: "30% Discount", value: 3000, percentage: 30, investorRoi: 42.8 },
    { label: "40% Discount", value: 4000, percentage: 40, investorRoi: 66.7 },
    { label: "50% Discount", value: 5000, percentage: 50, investorRoi: 100.0 },
  ],

  // Contract Addresses on Arbitrum
  contracts: {
    usdc: {
      address: getAddress("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
    },

    // Domain NFT Escrow Marketplace Core Contract
    marketplace: {
      address: getAddress("0x82E02Cf30Cdfb686dCdA48982eDcb754688bfDCa"),
    },

    domainNft: {
      address: getAddress("0xf853F8243F10a57CF5e43A49F156F132c05C21a6"),
    },

    // Protocol Admin / Multisig
    adminAddress: getAddress("0xD6e9BE7F02f2E00a6Ec454D5668Fb5c5BBCFDc52"),
  },
} as const;

// ABIs
export const MARKETPLACE_ABI = [
  {
    inputs: [{ internalType: "address", name: "_usdcTokenAddress", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "PayoutTooSmall",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "listingId", type: "uint256" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: true, internalType: "address", name: "nftContract", type: "address" },
      { indexed: false, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "string", name: "domainName", type: "string" },
      { indexed: false, internalType: "address", name: "idafToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "askingPriceUSDC", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "discountBps", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "offeringTotalUSDC", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "expiresAt", type: "uint256" },
    ],
    name: "ListingCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "listingId", type: "uint256" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "tokenAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdcPaid", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "totalTokensSold", type: "uint256" },
    ],
    name: "TokensPurchased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "listingId", type: "uint256" },
      { indexed: true, internalType: "address", name: "investor", type: "address" },
      { indexed: false, internalType: "uint256", name: "tokenAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdcRefunded", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "totalTokensSold", type: "uint256" },
    ],
    name: "TokensRedeemed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "listingId", type: "uint256" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ListingCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "listingId", type: "uint256" },
      { indexed: true, internalType: "address", name: "finalBuyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "askingPricePaid", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "investorShareUSDC", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "ownerProceedsUSDC", type: "uint256" },
    ],
    name: "ListingFinalizedSale",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "listingId", type: "uint256" },
      { indexed: true, internalType: "address", name: "triggeredBy", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ListingExpiredSettled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "listingId", type: "uint256" },
      { indexed: true, internalType: "address", name: "investor", type: "address" },
      { indexed: false, internalType: "uint256", name: "tokensBurned", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdcClaimed", type: "uint256" },
    ],
    name: "PayoutClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "listingId", type: "uint256" },
      { indexed: true, internalType: "address", name: "investor", type: "address" },
      { indexed: false, internalType: "uint256", name: "tokensBurned", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdcRefunded", type: "uint256" },
    ],
    name: "RefundClaimed",
    type: "event",
  },
  {
    inputs: [],
    name: "totalListings",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }],
    name: "getListing",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "listingId", type: "uint256" },
          { internalType: "address", name: "seller", type: "address" },
          { internalType: "address", name: "nftContract", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "string", name: "domainName", type: "string" },
          { internalType: "address", name: "idafToken", type: "address" },
          { internalType: "uint256", name: "askingPriceUSDC", type: "uint256" },
          { internalType: "uint256", name: "discountBps", type: "uint256" },
          { internalType: "uint256", name: "offeringTotalUSDC", type: "uint256" },
          { internalType: "uint256", name: "tokenPriceUSDC", type: "uint256" },
          { internalType: "uint256", name: "tokensSold", type: "uint256" },
          { internalType: "uint256", name: "escrowedUSDC", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "expiresAt", type: "uint256" },
          { internalType: "uint8", name: "state", type: "uint8" },
          { internalType: "address", name: "finalBuyer", type: "address" },
          { internalType: "uint256", name: "settledAt", type: "uint256" },
        ],
        internalType: "struct IDAFMarket.Listing",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "listingId", type: "uint256" },
      { internalType: "address", name: "investor", type: "address" },
    ],
    name: "getInvestorPosition",
    outputs: [
      { internalType: "uint256", name: "tokenBalance", type: "uint256" },
      { internalType: "uint256", name: "usdcContributed", type: "uint256" },
      { internalType: "uint256", name: "proRataShareBps", type: "uint256" },
      { internalType: "uint256", name: "potentialSalePayoutUSDC", type: "uint256" },
      { internalType: "uint256", name: "refundableUSDC", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "nftContract", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "string", name: "domainName", type: "string" },
      { internalType: "uint256", name: "askingPriceUSDC", type: "uint256" },
      { internalType: "uint256", name: "discountBps", type: "uint256" },
      { internalType: "uint256", name: "durationSeconds", type: "uint256" },
    ],
    name: "createListing",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "listingId", type: "uint256" },
      { internalType: "uint256", name: "tokenAmount", type: "uint256" },
    ],
    name: "buyTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "listingId", type: "uint256" },
      { internalType: "uint256", name: "tokenAmount", type: "uint256" },
    ],
    name: "redeemTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }],
    name: "buyoutDomain",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }],
    name: "claimSalePayout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }],
    name: "cancelListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }],
    name: "finalizeExpiredListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }],
    name: "claimRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC721_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "domainNameOf",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getDomainName",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "domain",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "domains",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "operator", type: "address" },
      { internalType: "bool", name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "string", name: "domain", type: "string" },
    ],
    name: "mintDomain",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "domainName", type: "string" }],
    name: "isDomainTaken",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

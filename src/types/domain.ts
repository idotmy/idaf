export enum ListingStatus {
  ACTIVE = 0,
  SOLD = 1,
  EXPIRED = 2,
  CANCELLED = 3,
  SETTLED = 4,
}

export interface DomainListing {
  listingId: number;
  seller: `0x${string}`;
  nftContract: `0x${string}`;
  tokenId: bigint;
  domainName: string;
  idafToken: `0x${string}`;
  askingPriceUSDC: bigint;
  discountBps: bigint;
  offeringTotalUSDC: bigint;
  tokenPriceUSDC: bigint;
  tokensSold: bigint;
  escrowedUSDC: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  state: ListingStatus;
  finalBuyer: `0x${string}`;
  settledAt: bigint;
}

export interface OwnedDomainNFT {
  tokenId: bigint;
  domainName: string;
  nftContract: `0x${string}`;
  isApprovedForMarketplace: boolean;
  isListedInEscrow: boolean;
  owner: `0x${string}`;
}

export interface InvestorPosition {
  tokenBalance: bigint;
  usdcContributed: bigint;
  proRataShareBps: bigint;
  potentialSalePayoutUSDC: bigint;
  refundableUSDC: bigint;
}

export interface TxStatus {
  state: 'idle' | 'preparing' | 'waiting-wallet' | 'pending' | 'success' | 'error';
  title?: string;
  txHash?: `0x${string}`;
  errorMessage?: string;
}

import { APP_CONFIG } from '../config/contracts.ts';

export function formatUSDC(amount: bigint | number | string | undefined): string {
  if (amount === undefined || amount === null) return '$0.00';
  const num = typeof amount === 'bigint' ? Number(amount) / 10 ** APP_CONFIG.currencyDecimals : Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(num);
}

export function formatTokenAmount(amount: bigint | number | undefined): string {
  if (amount === undefined || amount === null) return '0';
  const num = typeof amount === 'bigint' ? Number(amount) / 10 ** APP_CONFIG.tokensDecimals : Number(amount);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatAddress(address?: string): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBps(bps: bigint | number | undefined): string {
  if (bps === undefined) return '0%';
  const val = typeof bps === 'bigint' ? Number(bps) / 100 : bps / 100;
  return `${val.toFixed(1)}%`;
}

export function formatTimeRemaining(expiresAtBigInt: bigint): { text: string; isExpired: boolean; days: number; hours: number } {
  const expiresAt = Number(expiresAtBigInt) * 1000;
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return { text: 'Expired', isExpired: true, days: 0, hours: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return { text: `${days}d ${hours}h remaining`, isExpired: false, days, hours };
  }
  return { text: `${hours}h ${minutes}m remaining`, isExpired: false, days: 0, hours };
}

export function getExplorerTxUrl(txHash?: string): string {
  if (!txHash) return APP_CONFIG.blockExplorerUrl;
  return `${APP_CONFIG.blockExplorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address?: string): string {
  if (!address) return APP_CONFIG.blockExplorerUrl;
  return `${APP_CONFIG.blockExplorerUrl}/address/${address}`;
}

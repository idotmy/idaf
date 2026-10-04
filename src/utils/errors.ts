/**
 * Clean & resilient Web3 / RPC error parser.
 * Converts complex JSON-RPC errors, ABI reverts, and wallet rejections
 * into human-readable, friendly notifications without technical clutter.
 */
export function formatWeb3Error(err: any): string {
  if (!err) return 'An unexpected transaction error occurred.';

  // 1. Check for user rejection or wallet cancellation
  const code = err?.code ?? err?.cause?.code;
  const rawMsg = (
    (err?.shortMessage || '') +
    ' ' +
    (err?.message || '') +
    ' ' +
    (err?.details || '') +
    ' ' +
    (err?.data?.message || '') +
    ' ' +
    JSON.stringify(err || {})
  ).toLowerCase();

  if (
    code === 4001 ||
    rawMsg.includes('user rejected') ||
    rawMsg.includes('user denied') ||
    rawMsg.includes('rejected by user') ||
    rawMsg.includes('user cancelled') ||
    rawMsg.includes('user_canceled') ||
    rawMsg.includes('declined by user')
  ) {
    return 'Transaction was cancelled in your wallet.';
  }

  // 2. Insufficient ETH for gas
  if (
    rawMsg.includes('insufficient funds for gas') ||
    rawMsg.includes('insufficient funds') ||
    rawMsg.includes('exceeds the balance of the account')
  ) {
    return 'Insufficient ETH in your wallet to cover Arbitrum gas fees.';
  }

  // 3. Custom Solidity Contract Reverts
  if (rawMsg.includes('exceedsavailablesupply')) {
    return 'Purchase exceeds remaining available token supply for this domain.';
  }
  if (rawMsg.includes('insufficientpayment') || rawMsg.includes('transferfrom error') || rawMsg.includes('erc20: transfer amount exceeds balance')) {
    return 'Insufficient USDC balance or allowance to complete this purchase.';
  }
  if (rawMsg.includes('notlistingowner')) {
    return 'Action denied: Only the original domain listing creator can perform this.';
  }
  if (rawMsg.includes('listingexpired')) {
    return 'This domain offering has expired and can no longer accept purchases.';
  }
  if (rawMsg.includes('listingnotexpired')) {
    return 'This listing has not reached its expiration date yet.';
  }
  if (rawMsg.includes('notokenstoredeem')) {
    return 'You have no tokens available to redeem from this active offering.';
  }
  if (rawMsg.includes('notokenstoclaim')) {
    return 'No pro-rata payout available to claim for this wallet.';
  }
  if (rawMsg.includes('payouttoosmall')) {
    return 'Calculated payout is too small to process.';
  }
  if (rawMsg.includes('invalidaskingprice')) {
    return 'Asking price must be greater than 0 USDC.';
  }
  if (rawMsg.includes('invaliddiscount')) {
    return 'Please select a valid supported discount tier (10% - 50%).';
  }
  if (rawMsg.includes('invalidduration')) {
    return 'Listing duration must be between 1 hour and 365 days.';
  }
  if (rawMsg.includes('invalidlistingstate')) {
    return 'This domain listing is not in the required state for this operation.';
  }
  if (rawMsg.includes('reentrancyguard')) {
    return 'High-frequency transaction lock. Please wait a moment and try again.';
  }
  if (rawMsg.includes('notadmin')) {
    return 'Unauthorized: Admin privileges required.';
  }
  if (rawMsg.includes('transferfailed')) {
    return 'Token or USDC transfer failed. Please verify your balance and allowance.';
  }

  // 4. Network and gas price surges
  if (
    rawMsg.includes('max fee per gas less than block base fee') ||
    rawMsg.includes('gas price') ||
    rawMsg.includes('replacement transaction underpriced') ||
    rawMsg.includes('fee too low')
  ) {
    return 'Arbitrum network gas fees surged. Please try submitting again.';
  }

  // 5. Nonce / collision issues
  if (rawMsg.includes('nonce too low') || rawMsg.includes('transaction already imported')) {
    return 'Previous transaction is still processing. Please wait a few seconds and retry.';
  }

  // 6. Generic clean fallback (stripping JSON-RPC prefixes)
  if (err?.shortMessage && typeof err.shortMessage === 'string') {
    const clean = err.shortMessage
      .replace(/^error:\s*/i, '')
      .replace(/^execution reverted:\s*/i, '')
      .replace(/^the contract function ".*" reverted with the following reason:\s*/i, '');
    if (clean && clean.length < 100 && !clean.includes('0x') && !clean.includes('{')) {
      return clean;
    }
  }

  return 'Transaction was reverted by the network. Please verify your balances and try again.';
}

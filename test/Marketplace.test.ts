/**
 * Pure contract-math checks used by FaucetToolsView and the automated test runner.
 */

export interface TestResult {
  testNumber: number;
  name: string;
  passed: boolean;
  details: string;
}

export function runContractMathSuite(): TestResult[] {
  const results: TestResult[] = [];
  const TOTAL_SUPPLY = 1_000_000n * 10n**18n;
  const BPS = 10000n;

  // Test 1: Pricing Math for 1000 USDC with 20% Discount (2000 bps)
  const askingPrice = 1000n * 10n**6n; // 1000 USDC
  const discountBps = 2000n; // 20%
  const offeringTotal = (askingPrice * (BPS - discountBps)) / BPS; // 800 USDC
  
  results.push({
    testNumber: 1,
    name: "Offering Value Calculation",
    passed: offeringTotal === 800n * 10n**6n,
    details: `Expected 800 USDC, got ${Number(offeringTotal) / 1e6} USDC`
  });

  // Test 2: Token purchase of 100,000 tokens (10%)
  const tokensBought = 100_000n * 10n**18n;
  const usdcCost = (tokensBought * offeringTotal) / TOTAL_SUPPLY;
  results.push({
    testNumber: 2,
    name: "100k Token Purchase Cost",
    passed: usdcCost === 80n * 10n**6n,
    details: `Expected 80 USDC, got ${Number(usdcCost) / 1e6} USDC`
  });

  // Test 3: Settlement payout calculation when sold for 1000 USDC
  const investorShare = (tokensBought * askingPrice) / TOTAL_SUPPLY;
  const ownerShareFromSale = askingPrice - investorShare;
  const ownerTotalProceeds = ownerShareFromSale + usdcCost;
  
  results.push({
    testNumber: 3,
    name: "Pro-Rata Settlement Distribution",
    passed: investorShare === 100n * 10n**6n && ownerTotalProceeds === 980n * 10n**6n,
    details: `Investor gets ${Number(investorShare) / 1e6} USDC (+20 profit), Owner gets ${Number(ownerTotalProceeds) / 1e6} USDC`
  });

  // Test 4: 100% Refund on Expired/Cancelled Listing
  const refundAmount = (tokensBought * offeringTotal) / TOTAL_SUPPLY;
  results.push({
    testNumber: 4,
    name: "Zero-Loss Principal Refund on Expiry",
    passed: refundAmount === 80n * 10n**6n,
    details: `Investor gets full ${Number(refundAmount) / 1e6} USDC refund`
  });

  // Test 5: Edge Case 1 Token
  const oneToken = 1n * 10n**18n;
  const oneTokenCost = (oneToken * offeringTotal) / TOTAL_SUPPLY; // 0.0008 USDC = 800 micro-USDC
  results.push({
    testNumber: 5,
    name: "Edge Case: 1 Token Unit Cost",
    passed: oneTokenCost === 800n, // 800 / 1e6 = 0.0008 USDC
    details: `1 token cost is ${oneTokenCost} micro-USDC`
  });

  // Test 6: Edge Case 999,999 Tokens
  const largeTokens = 999_999n * 10n**18n;
  const largeCost = (largeTokens * offeringTotal) / TOTAL_SUPPLY;
  results.push({
    testNumber: 6,
    name: "Edge Case: 999,999 Tokens Cost",
    passed: largeCost === 799_999_200n, // 799.9992 USDC
    details: `999,999 tokens cost is ${Number(largeCost) / 1e6} USDC`
  });

  // Test 7: A tiny balance must not produce a claimable USDC amount.
  const dustTokenBalance = 1n;
  const dustSalePayout = (dustTokenBalance * askingPrice) / TOTAL_SUPPLY;
  results.push({
    testNumber: 7,
    name: "Tiny sale balance rounds to zero USDC",
    passed: dustSalePayout === 0n,
    details: `Expected zero USDC base units, got ${dustSalePayout}`
  });

  // Test 8: The smallest balance that pays one USDC base unit at this sale price.
  const minimumSaleClaimTokens = TOTAL_SUPPLY / askingPrice;
  const minimumSalePayout = (minimumSaleClaimTokens * askingPrice) / TOTAL_SUPPLY;
  results.push({
    testNumber: 8,
    name: "Minimum non-zero sale payout",
    passed: minimumSalePayout === 1n,
    details: `Expected 1 USDC base unit, got ${minimumSalePayout}`
  });

  // Test 9: Tiny cancellation/expiry refund amounts also round to zero.
  const dustRefund = (dustTokenBalance * offeringTotal) / TOTAL_SUPPLY;
  results.push({
    testNumber: 9,
    name: "Tiny refund balance rounds to zero USDC",
    passed: dustRefund === 0n,
    details: `Expected zero USDC base units, got ${dustRefund}`
  });

  return results;
}

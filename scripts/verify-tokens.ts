import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * IDAF Protocol - Automated Token Verification Utility for Arbiscan (Arbitrum One)
 * 
 * Usage:
 *   1. Verify all unverified tokens created by the marketplace:
 *      npx tsx scripts/verify-tokens.ts --all
 * 
 *   2. Verify a specific listing ID:
 *      npx tsx scripts/verify-tokens.ts --listing=1
 * 
 *   3. Watch mode (listens in real-time to new listings and verifies them immediately):
 *      npx tsx scripts/verify-tokens.ts --watch
 */

// Configuration
const CONFIG = {
  chainId: 42161,
  marketplaceAddress: '0x82E02Cf30Cdfb686dCdA48982eDcb754688bfDCa',
  rpcUrl: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
  // Etherscan API V2 unified endpoint supports all chains including Arbitrum One (chainid=42161)
  apiUrl: 'https://api.etherscan.io/v2/api',
  etherscanApiKey: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken',
  compilerVersion: 'v0.8.37+commit.ac538093',
  runs: '200',
};

// Self-contained flattened Solidity source code for IDAFToken
const IDAF_TOKEN_SOURCE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

contract IDAFToken is IERC20Metadata {
    string public override name;
    string public override symbol;
    uint8 public constant override decimals = 18;
    uint256 public override totalSupply;
    
    address public immutable marketplace;
    uint256 public immutable listingId;
    string public domainName;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    error OnlyMarketplace();
    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    modifier onlyMarketplace() {
        if (msg.sender != marketplace) revert OnlyMarketplace();
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _domainName,
        uint256 _listingId,
        address _marketplace
    ) {
        if (_marketplace == address(0)) revert ZeroAddress();
        name = _name;
        symbol = _symbol;
        domainName = _domainName;
        listingId = _listingId;
        marketplace = _marketplace;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < amount) revert InsufficientAllowance();
            unchecked {
                _approve(from, msg.sender, currentAllowance - amount);
            }
        }
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyMarketplace {
        if (to == address(0)) revert ZeroAddress();
        totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyMarketplace {
        if (_balances[from] < amount) revert InsufficientBalance();
        unchecked {
            _balances[from] -= amount;
            totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        if (_balances[from] < amount) revert InsufficientBalance();
        unchecked {
            _balances[from] -= amount;
            _balances[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        if (owner == address(0) || spender == address(0)) revert ZeroAddress();
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
`;

const MARKETPLACE_ABI = [
  'function totalListings() external view returns (uint256)',
  'function getListing(uint256 listingId) external view returns (tuple(uint256 listingId, address seller, address nftContract, uint256 tokenId, string domainName, address idafToken, uint256 askingPriceUSDC, uint256 discountBps, uint256 offeringTotalUSDC, uint256 tokenPriceUSDC, uint256 tokensSold, uint256 escrowedUSDC, uint256 createdAt, uint256 expiresAt, uint8 state, address finalBuyer, uint256 settledAt))',
  'event ListingCreated(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, string domainName, address idafToken, uint256 askingPriceUSDC, uint256 discountBps, uint256 offeringTotalUSDC, uint256 expiresAt)'
];

const TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function domainName() external view returns (string)',
  'function listingId() external view returns (uint256)',
  'function marketplace() external view returns (address)'
];

/**
 * Replicates the _cleanSymbol logic in IDAFMarket.sol
 */
function cleanSymbol(str: string): string {
  let cleaned = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = char.charCodeAt(0);
    if (
      (code >= 48 && code <= 57) || // 0-9
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122)   // a-z
    ) {
      cleaned += char.toUpperCase();
    }
  }
  return cleaned.length === 0 ? 'FRAC' : cleaned;
}

/**
 * Checks if a contract address is already verified on Arbiscan / Etherscan
 */
async function isContractVerified(address: string): Promise<boolean> {
  try {
    const url = `${CONFIG.apiUrl}?chainid=${CONFIG.chainId}&module=contract&action=getabi&address=${address}&apikey=${CONFIG.etherscanApiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.status === '1' && data.message === 'OK';
  } catch (err) {
    return false;
  }
}

/**
 * Encodes constructor arguments for IDAFToken
 * Constructor signature: (string _name, string _symbol, string _domainName, uint256 _listingId, address _marketplace)
 */
function encodeConstructorArgs(
  name: string,
  symbol: string,
  domainName: string,
  listingId: bigint | number,
  marketplaceAddress: string
): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encoded = abiCoder.encode(
    ['string', 'string', 'string', 'uint256', 'address'],
    [name, symbol, domainName, BigInt(listingId), marketplaceAddress]
  );
  // Remove 0x prefix for Arbiscan API submission
  return encoded.startsWith('0x') ? encoded.slice(2) : encoded;
}

/**
 * Submits the token contract source code to Arbiscan / Etherscan for automated verification
 */
async function submitVerification(
  tokenAddress: string,
  name: string,
  symbol: string,
  domainName: string,
  listingId: number | bigint
): Promise<{ success: boolean; message: string; guid?: string }> {
  console.log(`\n🔍 Verifying Token on Explorer (Arbitrum One):`);
  console.log(`   - Address:    ${tokenAddress}`);
  console.log(`   - Listing ID: #${listingId}`);
  console.log(`   - Name:       "${name}"`);
  console.log(`   - Symbol:     "${symbol}"`);
  console.log(`   - Domain:     "${domainName}"`);

  const constructorArgs = encodeConstructorArgs(name, symbol, domainName, listingId, CONFIG.marketplaceAddress);

  const params = new URLSearchParams();
  params.append('chainid', String(CONFIG.chainId));
  params.append('apikey', CONFIG.etherscanApiKey);
  params.append('module', 'contract');
  params.append('action', 'verifysourcecode');
  params.append('contractaddress', tokenAddress);
  params.append('sourceCode', IDAF_TOKEN_SOURCE_CODE);
  params.append('codeformat', 'solidity-single-file');
  params.append('contractname', 'IDAFToken');
  params.append('compilerversion', CONFIG.compilerVersion);
  params.append('optimizationUsed', '1');
  params.append('runs', CONFIG.runs);
  params.append('constructorArguements', constructorArgs);
  params.append('licenseType', '3'); // MIT

  try {
    const response = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.status === '1') {
      console.log(`   ✅ Verification Request Submitted Successfully! GUID: ${data.result}`);
      return { success: true, message: data.result, guid: data.result };
    } else {
      console.log(`   ⚠️ Explorer Response: ${data.message} - ${data.result}`);
      return { success: false, message: data.result };
    }
  } catch (error: any) {
    console.error(`   ❌ Failed to submit verification request:`, error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Verifies a single listing
 */
async function verifyListing(provider: ethers.JsonRpcProvider, listingId: number) {
  const market = new ethers.Contract(CONFIG.marketplaceAddress, MARKETPLACE_ABI, provider);
  const listing = await market.getListing(listingId);
  const tokenAddress = listing.idafToken;

  if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
    console.log(`Listing #${listingId} does not have a valid token address.`);
    return;
  }

  const alreadyVerified = await isContractVerified(tokenAddress);
  if (alreadyVerified) {
    console.log(`✅ Token at ${tokenAddress} (Listing #${listingId}) is ALREADY verified on Arbiscan.`);
    return;
  }

  // Fetch token metadata from on-chain contract for 100% exact match
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  const [name, symbol, domainName] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
    tokenContract.domainName()
  ]);

  await submitVerification(tokenAddress, name, symbol, domainName, listingId);
}

/**
 * Scan all listings and verify any unverified tokens
 */
async function verifyAllListings() {
  console.log(`🚀 Starting Full Verification Scan on Arbitrum One...`);
  console.log(`Marketplace: ${CONFIG.marketplaceAddress}`);

  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const market = new ethers.Contract(CONFIG.marketplaceAddress, MARKETPLACE_ABI, provider);
  
  const total = Number(await market.totalListings());
  console.log(`Found ${total} total listings on-chain.`);

  if (total === 0) {
    console.log('No listings found.');
    return;
  }

  for (let id = 1; id <= total; id++) {
    try {
      await verifyListing(provider, id);
      // Small pause to prevent API rate-limits
      await new Promise((r) => setTimeout(r, 1200));
    } catch (e: any) {
      console.error(`Error processing listing #${id}:`, e.message);
    }
  }

  console.log(`\n🎉 Verification scan completed!`);
}

/**
 * Watcher mode: Listens live to new ListingCreated events
 */
async function startWatcher() {
  console.log(`👀 Starting Real-Time Watcher for new IDAF Listings on Arbitrum One...`);
  console.log(`Listening on Marketplace contract: ${CONFIG.marketplaceAddress}`);

  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const market = new ethers.Contract(CONFIG.marketplaceAddress, MARKETPLACE_ABI, provider);

  market.on('ListingCreated', async (listingId, seller, nftContract, tokenId, domainName, idafToken) => {
    const lid = Number(listingId);
    console.log(`\n🔔 New Listing Detected: #${lid} (${domainName})`);
    console.log(`   Token Address: ${idafToken}`);
    
    // Wait 10 seconds for Arbiscan indexer to catch the contract deployment block
    console.log(`   Waiting 10s for explorer indexing...`);
    await new Promise((r) => setTimeout(r, 10000));

    try {
      const name = `IDAF ${domainName}`;
      const symbol = `IDAF-${cleanSymbol(domainName)}`;
      await submitVerification(idafToken, name, symbol, domainName, lid);
    } catch (err: any) {
      console.error(`   ❌ Failed to auto-verify listing #${lid}:`, err.message);
    }
  });

  // Keep process running
  process.stdin.resume();
}

// CLI Routing
async function main() {
  const args = process.argv.slice(2);
  const listingArg = args.find((a) => a.startsWith('--listing='));
  const isWatch = args.includes('--watch');

  if (listingArg) {
    const listingId = parseInt(listingArg.split('=')[1], 10);
    const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
    await verifyListing(provider, listingId);
  } else if (isWatch) {
    await startWatcher();
  } else {
    await verifyAllListings();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

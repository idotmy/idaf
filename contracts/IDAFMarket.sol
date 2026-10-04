// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

/*

██╗██████╗  █████╗ ███████╗    ██████╗ ██████╗  ██████╗ ████████╗ ██████╗  ██████╗ ██████╗ ██╗     
██║██╔══██╗██╔══██╗██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔═══██╗██╔════╝██╔═══██╗██║     
██║██║  ██║███████║█████╗      ██████╔╝██████╔╝██║   ██║   ██║   ██║   ██║██║     ██║   ██║██║     
██║██║  ██║██╔══██║██╔══╝      ██╔═══╝ ██╔══██╗██║   ██║   ██║   ██║   ██║██║     ██║   ██║██║     
██║██████╔╝██║  ██║██║         ██║     ██║  ██║╚██████╔╝   ██║   ╚██████╔╝╚██████╗╚██████╔╝███████╗
╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝         ╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝
                                                                                                
──────────────────────────────────────────────────────────────────────────────────────

IDAF Protocol

Official smart contracts powering the IDAF Protocol.

──────────────────────────────────────────────────────────────────────────────────────

*/

/**
 * @dev Interface of ERC20 standard.
 */
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

/**
 * @dev Interface for the optional metadata functions in ERC20 standard.
 */
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

/**
 * @dev Interface of ERC721 standard.
 */
interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function ownerOf(uint256 tokenId) external view returns (address owner);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

/**
 * @title IDAFToken
 * @notice Dedicated ERC-20 token representing fractional economic rights to a domain sale.
 */
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

/**
 * @title IDAFMarket
 * @notice Complete on-chain Tokenization and Fractionalization marketplace for Web3 Domain NFTs on Arbitrum.
 * @dev 100% Self-Contained / Standalone contract with Zero external imports for seamless Remix IDE compilation.
 */
contract IDAFMarket is IERC721Receiver {
    enum ListingState {
        ACTIVE,
        SOLD,
        EXPIRED,
        CANCELLED,
        SETTLED
    }

    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        string domainName;
        address idafToken;
        uint256 askingPriceUSDC;    // In USDC units (6 decimals)
        uint256 discountBps;        // Basis points (e.g. 2000 = 20%)
        uint256 offeringTotalUSDC;  // Total offering value = askingPrice * (10000 - discount) / 10000
        uint256 tokenPriceUSDC;     // Price per single token unit in USDC (offeringTotalUSDC / 1_000_000)
        uint256 tokensSold;         // Tokens sold (18 decimals)
        uint256 escrowedUSDC;       // Total USDC collected from buyers
        uint256 createdAt;
        uint256 expiresAt;
        ListingState state;
        address finalBuyer;
        uint256 settledAt;
    }

    uint256 public constant TOTAL_TOKEN_SUPPLY = 1_000_000 * 10**18; // 1 Million tokens with 18 decimals
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 365 days;

    IERC20 public immutable usdcToken;
    address public admin;
    uint256 public totalListings;
    bool private _reentrancyLocked;

    // Allowed discount basis points: 1000 (10%), 2000 (20%), 3000 (30%), 4000 (40%), 5000 (50%)
    mapping(uint256 => bool) public isAllowedDiscount;
    
    // listingId => Listing
    mapping(uint256 => Listing) public listings;

    // listingId => investor address => USDC contributed
    mapping(uint256 => mapping(address => uint256)) public investorUSDCContributed;

    // Events for comprehensive on-chain discovery
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        string domainName,
        address idafToken,
        uint256 askingPriceUSDC,
        uint256 discountBps,
        uint256 offeringTotalUSDC,
        uint256 expiresAt
    );

    event TokensPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 tokenAmount,
        uint256 usdcPaid,
        uint256 totalTokensSold
    );

    event TokensRedeemed(
        uint256 indexed listingId,
        address indexed investor,
        uint256 tokenAmount,
        uint256 usdcRefunded,
        uint256 totalTokensSold
    );

    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller,
        uint256 timestamp
    );

    event ListingFinalizedSale(
        uint256 indexed listingId,
        address indexed finalBuyer,
        uint256 askingPricePaid,
        uint256 investorShareUSDC,
        uint256 ownerProceedsUSDC
    );

    event ListingExpiredSettled(
        uint256 indexed listingId,
        address indexed triggeredBy,
        uint256 timestamp
    );

    event PayoutClaimed(
        uint256 indexed listingId,
        address indexed investor,
        uint256 tokensBurned,
        uint256 usdcClaimed
    );

    event RefundClaimed(
        uint256 indexed listingId,
        address indexed investor,
        uint256 tokensBurned,
        uint256 usdcRefunded
    );

    error ReentrancyGuard();
    error NotAdmin();
    error InvalidAddress();
    error InvalidDuration();
    error InvalidAskingPrice();
    error InvalidDiscount();
    error InvalidListingState();
    error ListingExpired();
    error ListingNotExpired();
    error ExceedsAvailableSupply();
    error InsufficientPayment();
    error NotListingOwner();
    error NoTokensToRedeem();
    error NoTokensToClaim();
    error PayoutTooSmall();
    error TransferFailed();

    modifier nonReentrant() {
        if (_reentrancyLocked) revert ReentrancyGuard();
        _reentrancyLocked = true;
        _;
        _reentrancyLocked = false;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(address _usdcTokenAddress) {
        if (_usdcTokenAddress == address(0)) revert InvalidAddress();
        usdcToken = IERC20(_usdcTokenAddress);
        admin = msg.sender;

        // Seed allowed discount tiers
        isAllowedDiscount[1000] = true; // 10%
        isAllowedDiscount[2000] = true; // 20%
        isAllowedDiscount[3000] = true; // 30%
        isAllowedDiscount[4000] = true; // 40%
        isAllowedDiscount[5000] = true; // 50%
    }

    /**
     * @notice Create a new Fractional Domain Listing by depositing the Domain NFT into Escrow.
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        string memory domainName,
        uint256 askingPriceUSDC,
        uint256 discountBps,
        uint256 durationSeconds
    ) external nonReentrant returns (uint256) {
        if (nftContract == address(0)) revert InvalidAddress();
        if (askingPriceUSDC == 0) revert InvalidAskingPrice();
        if (!isAllowedDiscount[discountBps]) revert InvalidDiscount();
        if (durationSeconds < MIN_DURATION || durationSeconds > MAX_DURATION) revert InvalidDuration();

        // Calculate offering economics
        uint256 offeringTotalUSDC = (askingPriceUSDC * (BPS_DENOMINATOR - discountBps)) / BPS_DENOMINATOR;
        uint256 tokenPriceUSDC = (offeringTotalUSDC * 10**18) / TOTAL_TOKEN_SUPPLY;

        uint256 listingId = ++totalListings;
        uint256 expiresAt = block.timestamp + durationSeconds;

        // Deploy dedicated Fractional ERC-20 token for this listing
        string memory tokenSymbol = string(abi.encodePacked("IDAF-", _cleanSymbol(domainName)));
        IDAFToken fracToken = new IDAFToken(
            string(abi.encodePacked("IDAF ", domainName)),
            tokenSymbol,
            domainName,
            listingId,
            address(this)
        );

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            domainName: domainName,
            idafToken: address(fracToken),
            askingPriceUSDC: askingPriceUSDC,
            discountBps: discountBps,
            offeringTotalUSDC: offeringTotalUSDC,
            tokenPriceUSDC: tokenPriceUSDC,
            tokensSold: 0,
            escrowedUSDC: 0,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            state: ListingState.ACTIVE,
            finalBuyer: address(0),
            settledAt: 0
        });

        // Transfer the NFT from user to escrow contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        emit ListingCreated(
            listingId,
            msg.sender,
            nftContract,
            tokenId,
            domainName,
            address(fracToken),
            askingPriceUSDC,
            discountBps,
            offeringTotalUSDC,
            expiresAt
        );

        return listingId;
    }

    /**
     * @notice Buy fractional tokens of an active domain offering.
     */
    function buyTokens(uint256 listingId, uint256 tokenAmount) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.state != ListingState.ACTIVE) revert InvalidListingState();
        if (block.timestamp >= listing.expiresAt) revert ListingExpired();
        if (tokenAmount == 0) revert InsufficientPayment();
        if (listing.tokensSold + tokenAmount > TOTAL_TOKEN_SUPPLY) revert ExceedsAvailableSupply();

        uint256 usdcCost = (tokenAmount * listing.offeringTotalUSDC) / TOTAL_TOKEN_SUPPLY;
        if (usdcCost == 0) revert InsufficientPayment();

        listing.tokensSold += tokenAmount;
        listing.escrowedUSDC += usdcCost;
        investorUSDCContributed[listingId][msg.sender] += usdcCost;

        bool success = usdcToken.transferFrom(msg.sender, address(this), usdcCost);
        if (!success) revert TransferFailed();

        IDAFToken(listing.idafToken).mint(msg.sender, tokenAmount);

        emit TokensPurchased(listingId, msg.sender, tokenAmount, usdcCost, listing.tokensSold);
    }

    /**
     * @notice Redeem fractional tokens during active listing offering period.
     */
    function redeemTokens(uint256 listingId, uint256 tokenAmount) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.state != ListingState.ACTIVE) revert InvalidListingState();
        if (block.timestamp >= listing.expiresAt) revert ListingExpired();
        if (tokenAmount == 0) revert NoTokensToRedeem();

        IDAFToken fracToken = IDAFToken(listing.idafToken);
        uint256 userBalance = fracToken.balanceOf(msg.sender);
        if (userBalance < tokenAmount) revert NoTokensToRedeem();

        uint256 usdcRefund = (tokenAmount * listing.offeringTotalUSDC) / TOTAL_TOKEN_SUPPLY;
        if (usdcRefund > listing.escrowedUSDC) {
            usdcRefund = listing.escrowedUSDC;
        }
        if (usdcRefund == 0) revert PayoutTooSmall();

        listing.tokensSold -= tokenAmount;
        listing.escrowedUSDC -= usdcRefund;
        if (investorUSDCContributed[listingId][msg.sender] >= usdcRefund) {
            investorUSDCContributed[listingId][msg.sender] -= usdcRefund;
        } else {
            investorUSDCContributed[listingId][msg.sender] = 0;
        }

        fracToken.burn(msg.sender, tokenAmount);

        bool success = usdcToken.transfer(msg.sender, usdcRefund);
        if (!success) revert TransferFailed();

        emit TokensRedeemed(listingId, msg.sender, tokenAmount, usdcRefund, listing.tokensSold);
    }

    /**
     * @notice Final Buyer purchases the entire Domain NFT at the Asking Price.
     */
    function buyoutDomain(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.state != ListingState.ACTIVE) revert InvalidListingState();
        if (block.timestamp >= listing.expiresAt) revert ListingExpired();

        uint256 askingPrice = listing.askingPriceUSDC;
        address seller = listing.seller;
        address buyer = msg.sender;

        bool success = usdcToken.transferFrom(buyer, address(this), askingPrice);
        if (!success) revert TransferFailed();

        listing.state = ListingState.SOLD;
        listing.finalBuyer = buyer;
        listing.settledAt = block.timestamp;

        uint256 investorShareUSDC = (listing.tokensSold * askingPrice) / TOTAL_TOKEN_SUPPLY;
        uint256 ownerProceedsFromSale = askingPrice - investorShareUSDC;
        uint256 totalOwnerProceeds = ownerProceedsFromSale + listing.escrowedUSDC;

        if (totalOwnerProceeds > 0) {
            bool ownerTransfer = usdcToken.transfer(seller, totalOwnerProceeds);
            if (!ownerTransfer) revert TransferFailed();
        }

        IERC721(listing.nftContract).safeTransferFrom(address(this), buyer, listing.tokenId);

        emit ListingFinalizedSale(
            listingId,
            buyer,
            askingPrice,
            investorShareUSDC,
            totalOwnerProceeds
        );
    }

    /**
     * @notice Claim pro-rata payout after successful domain sale.
     */
    function claimSalePayout(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.state != ListingState.SOLD) revert InvalidListingState();

        IDAFToken fracToken = IDAFToken(listing.idafToken);
        uint256 userTokens = fracToken.balanceOf(msg.sender);
        if (userTokens == 0) revert NoTokensToClaim();

        uint256 payoutUSDC = (userTokens * listing.askingPriceUSDC) / TOTAL_TOKEN_SUPPLY;
        if (payoutUSDC == 0) revert PayoutTooSmall();

        fracToken.burn(msg.sender, userTokens);

        bool success = usdcToken.transfer(msg.sender, payoutUSDC);
        if (!success) revert TransferFailed();

        emit PayoutClaimed(listingId, msg.sender, userTokens, payoutUSDC);
    }

    /**
     * @notice Cancel listing before sale. Only domain seller can call.
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.state != ListingState.ACTIVE) revert InvalidListingState();
        if (msg.sender != listing.seller) revert NotListingOwner();

        listing.state = ListingState.CANCELLED;
        listing.settledAt = block.timestamp;

        IERC721(listing.nftContract).safeTransferFrom(address(this), listing.seller, listing.tokenId);

        emit ListingCancelled(listingId, msg.sender, block.timestamp);
    }

    /**
     * @notice Permissionless function to settle expired listings.
     */
    function finalizeExpiredListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.state != ListingState.ACTIVE) revert InvalidListingState();
        if (block.timestamp < listing.expiresAt) revert ListingNotExpired();

        listing.state = ListingState.EXPIRED;
        listing.settledAt = block.timestamp;

        IERC721(listing.nftContract).safeTransferFrom(address(this), listing.seller, listing.tokenId);

        emit ListingExpiredSettled(listingId, msg.sender, block.timestamp);
    }

    /**
     * @notice Claim 100% refund of initial payment for CANCELLED or EXPIRED listings.
     */
    function claimRefund(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.state != ListingState.CANCELLED && listing.state != ListingState.EXPIRED) {
            revert InvalidListingState();
        }

        IDAFToken fracToken = IDAFToken(listing.idafToken);
        uint256 userTokens = fracToken.balanceOf(msg.sender);
        if (userTokens == 0) revert NoTokensToClaim();

        uint256 refundUSDC = (userTokens * listing.offeringTotalUSDC) / TOTAL_TOKEN_SUPPLY;
        if (refundUSDC == 0) revert PayoutTooSmall();

        fracToken.burn(msg.sender, userTokens);

        bool success = usdcToken.transfer(msg.sender, refundUSDC);
        if (!success) revert TransferFailed();

        emit RefundClaimed(listingId, msg.sender, userTokens, refundUSDC);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getInvestorPosition(uint256 listingId, address investor) external view returns (
        uint256 tokenBalance,
        uint256 usdcContributed,
        uint256 proRataShareBps,
        uint256 potentialSalePayoutUSDC,
        uint256 refundableUSDC
    ) {
        Listing storage listing = listings[listingId];
        if (listing.idafToken == address(0)) {
            return (0, 0, 0, 0, 0);
        }

        tokenBalance = IDAFToken(listing.idafToken).balanceOf(investor);
        usdcContributed = investorUSDCContributed[listingId][investor];
        
        if (tokenBalance > 0) {
            proRataShareBps = (tokenBalance * BPS_DENOMINATOR) / TOTAL_TOKEN_SUPPLY;
            potentialSalePayoutUSDC = (tokenBalance * listing.askingPriceUSDC) / TOTAL_TOKEN_SUPPLY;
            refundableUSDC = (tokenBalance * listing.offeringTotalUSDC) / TOTAL_TOKEN_SUPPLY;
        }
    }

    function setAllowedDiscount(uint256 discountBps, bool allowed) external onlyAdmin {
        isAllowedDiscount[discountBps] = allowed;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function _cleanSymbol(string memory input) internal pure returns (string memory) {
        bytes memory b = bytes(input);
        bytes memory out = new bytes(b.length);
        uint256 len = 0;
        for (uint256 i = 0; i < b.length && len < 8; i++) {
            bytes1 char = b[i];
            if ((char >= 0x30 && char <= 0x39) || (char >= 0x41 && char <= 0x5A)) {
                out[len++] = char;
            } else if (char >= 0x61 && char <= 0x7A) {
                out[len++] = bytes1(uint8(char) - 32);
            }
        }
        if (len == 0) return "DOTI";
        bytes memory trimmed = new bytes(len);
        for (uint256 j = 0; j < len; j++) {
            trimmed[j] = out[j];
        }
        return string(trimmed);
    }
}

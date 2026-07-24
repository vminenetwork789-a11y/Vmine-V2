// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VMinesNetwork
 * @dev Smart Contract for VMines Network Matrix MLM Platform (12 Ranks x 4 Slots Matrix System)
 * Compatible with EVM networks (BNB Smart Chain / Polygon / Ethereum) using USDT (IERC20).
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 indexed value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract VMinesNetwork {
    // IERC20 USDT Token Address
    IERC20 public immutable usdtToken;

    address public owner;
    uint256 public lastUserId = 1;

    // Rank Prices in USDT (6 decimals for standard BSC/Ethereum USDT, adjusted with MULTIPLIER)
    uint256 public constant DECIMALS = 1e18; // Default 18 or 6 decimals, customizable
    
    mapping(uint8 => uint256) public rankPrices;

    struct User {
        uint256 id;
        address userAddress;
        uint256 referrerId;
        uint256 totalEarned;
        uint256 totalDownlines;
        bool exists;
    }

    struct MatrixSlot {
        uint256 currentReferrerId;
        uint256[] firstLevelReferrals; // Max 4 referrals in current matrix cycle
        uint256 cycleCount;
        bool active;
    }

    // Mappings
    mapping(uint256 => User) public users;
    mapping(address => uint256) public addressToId;
    mapping(uint256 => address) public idToAddress;

    // user ID => rank ID (1 to 12) => MatrixSlot
    mapping(uint256 => mapping(uint8 => MatrixSlot)) public userMatrix;

    // Events
    event UserRegistered(uint256 indexed userId, address indexed userAddress, uint256 indexed referrerId);
    event RankPurchased(uint256 indexed userId, uint8 indexed rankId, uint256 price);
    event MatrixSlotFilled(uint256 indexed userId, uint8 indexed rankId, uint256 indexed filledByUserId, uint8 slotPosition);
    event RebornTriggered(uint256 indexed userId, uint8 indexed rankId, uint256 cycle);
    event AutoUpgraded(uint256 indexed userId, uint8 indexed nextRankId);
    event PayoutDistributed(uint256 indexed recipientId, uint256 amount, string payoutType);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _usdtTokenAddress) {
        require(_usdtTokenAddress != address(0), "Invalid USDT token address");
        owner = msg.sender;
        usdtToken = IERC20(_usdtTokenAddress);

        // Initialize 12 Rank Prices (5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240 USDT)
        uint256 basePrice = 5 * DECIMALS;
        for (uint8 i = 1; i <= 12; i++) {
            rankPrices[i] = basePrice;
            basePrice *= 2;
        }

        // Register Root User (ID 1 - Contract Owner)
        users[1] = User({
            id: 1,
            userAddress: msg.sender,
            referrerId: 0,
            totalEarned: 0,
            totalDownlines: 0,
            exists: true
        });

        addressToId[msg.sender] = 1;
        idToAddress[1] = msg.sender;

        // Activate all 12 ranks for Root User
        for (uint8 i = 1; i <= 12; i++) {
            userMatrix[1][i].active = true;
        }
    }

    /**
     * @notice Register a new member with a referrer ID and automatically buy Rank 1
     * @param referrerId The ID of the sponsor/referrer
     */
    function register(uint256 referrerId) external {
        require(!users[addressToId[msg.sender]].exists, "User already registered");
        require(users[referrerId].exists, "Referrer does not exist");

        lastUserId++;
        uint256 newUserId = lastUserId;

        users[newUserId] = User({
            id: newUserId,
            userAddress: msg.sender,
            referrerId: referrerId,
            totalEarned: 0,
            totalDownlines: 0,
            exists: true
        });

        addressToId[msg.sender] = newUserId;
        idToAddress[newUserId] = msg.sender;
        users[referrerId].totalDownlines++;

        emit UserRegistered(newUserId, msg.sender, referrerId);

        // Buy Rank 1 upon registration
        _buyRankInternal(newUserId, 1);
    }

    /**
     * @notice Buy/Activate a Rank for the caller
     * @param rankId Rank level from 1 to 12
     */
    function buyRank(uint8 rankId) external {
        uint256 userId = addressToId[msg.sender];
        require(users[userId].exists, "User not registered");
        require(rankId >= 1 && rankId <= 12, "Invalid rank ID");
        require(!userMatrix[userId][rankId].active, "Rank already active");

        if (rankId > 1) {
            require(userMatrix[userId][rankId - 1].active, "Must activate previous rank first");
        }

        _buyRankInternal(userId, rankId);
    }

    /**
     * @dev Internal logic for rank purchase and matrix placement
     */
    function _buyRankInternal(uint256 userId, uint8 rankId) internal {
        uint256 price = rankPrices[rankId];

        // Transfer USDT from buyer to contract
        require(
            usdtToken.transferFrom(msg.sender, address(this), price),
            "USDT transfer failed"
        );

        userMatrix[userId][rankId].active = true;
        emit RankPurchased(userId, rankId, price);

        // Find placement in sponsor's matrix
        uint256 sponsorId = users[userId].referrerId;
        _placeInMatrix(userId, sponsorId, rankId, price);
    }

    /**
     * @dev Place user in referrer's 4-slot matrix and process payments/auto-ups
     */
    function _placeInMatrix(uint256 userId, uint256 targetSponsorId, uint8 rankId, uint256 price) internal {
        // Fallback to owner if sponsor doesn't have active rank
        while (!userMatrix[targetSponsorId][rankId].active && targetSponsorId != 1) {
            targetSponsorId = users[targetSponsorId].referrerId;
        }

        MatrixSlot storage slot = userMatrix[targetSponsorId][rankId];
        slot.firstLevelReferrals.push(userId);
        uint8 position = uint8(slot.firstLevelReferrals.length);

        emit MatrixSlotFilled(targetSponsorId, rankId, userId, position);

        // Matrix Logic:
        // Slots 1 & 2 (50% Direct Income + 50% Reborn Contribution)
        if (position <= 2) {
            uint256 directShare = price / 2;
            _distributePayout(targetSponsorId, directShare, "Direct Commission (50%)");

            // Slots 1 & 2 filled -> Trigger Reborn
            if (position == 2) {
                emit RebornTriggered(targetSponsorId, rankId, slot.cycleCount);
            }
        } 
        // Slots 3 & 4 (100% Accumulation for Auto Upgrade)
        else if (position >= 3 && position <= 4) {
            // Slot 4 filled -> Matrix Cycle Completed
            if (position == 4) {
                slot.cycleCount++;

                // Reset matrix referrals for next cycle
                delete slot.firstLevelReferrals;

                // Auto-Upgrade to next rank if not max rank (Rank 12)
                if (rankId < 12 && !userMatrix[targetSponsorId][rankId + 1].active) {
                    userMatrix[targetSponsorId][rankId + 1].active = true;
                    emit AutoUpgraded(targetSponsorId, rankId + 1);
                    
                    // Place into sponsor's matrix for next rank
                    uint256 nextRankPrice = rankPrices[rankId + 1];
                    uint256 nextSponsorId = users[targetSponsorId].referrerId;
                    _placeInMatrix(targetSponsorId, nextSponsorId, rankId + 1, nextRankPrice);
                } else {
                    // If already at Rank 12 or next rank active, payout 100% to user
                    _distributePayout(targetSponsorId, price, "Matrix Cycle Complete (100%)");
                }
            }
        }
    }

    /**
     * @dev Internal payout function using USDT
     */
    function _distributePayout(uint256 recipientId, uint256 amount, string memory payoutType) internal {
        address recipientAddr = idToAddress[recipientId];
        if (recipientAddr == address(0)) {
            recipientAddr = idToAddress[1]; // Fallback to Root
        }

        users[recipientId].totalEarned += amount;
        require(usdtToken.transfer(recipientAddr, amount), "Payout transfer failed");

        emit PayoutDistributed(recipientId, amount, payoutType);
    }

    // --- VIEW FUNCTIONS ---

    /**
     * @notice View user's matrix referrals for a specific rank
     */
    function getUserMatrixReferrals(uint256 userId, uint8 rankId) 
        external 
        view 
        returns (uint256[] memory referrals, uint256 cycleCount, bool active) 
    {
        MatrixSlot memory slot = userMatrix[userId][rankId];
        return (slot.firstLevelReferrals, slot.cycleCount, slot.active);
    }

    /**
     * @notice Get user account details by address
     */
    function getUserDetailsByAddress(address userAddr)
        external
        view
        returns (
            uint256 id,
            uint256 referrerId,
            uint256 totalEarned,
            uint256 totalDownlines,
            bool exists
        )
    {
        uint256 uid = addressToId[userAddr];
        User memory u = users[uid];
        return (u.id, u.referrerId, u.totalEarned, u.totalDownlines, u.exists);
    }

    /**
     * @notice Emergency Token Rescue (Owner only)
     */
    function rescueTokens(address tokenAddr, uint256 amount) external onlyOwner {
        IERC20(tokenAddr).transfer(owner, amount);
    }
}

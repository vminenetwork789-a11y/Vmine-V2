// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        _requireNotEntered();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    function _requireNotEntered() private view {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism.
 */
abstract contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() internal view virtual {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
    }
}

/**
 * @title DecentralizedMatrixPlan
 * @notice Smart contract implementing a 2x2 matrix system with commissions, auto-upgrades, and auto-reborn mechanics.
 * @dev Especially features a unique auto-reborn mechanism on Rank 1 (Plan 1) which utilizes 50% from Slot 1 & 2
 *      to create 1 Reborn ID in Rank 1 and 1 Reborn ID in Rank 2 under the user's recursive downline.
 */
contract DecentralizedMatrixPlan is ReentrancyGuard, Ownable {

    struct User {
        uint256 id;
        address wallet;
        uint256 referrerId;
        uint256 totalIncome;
        uint256 downlinesCount;
        uint256 currentMaxRank;
        mapping(uint256 => Plan) plans;
    }

    struct Plan {
        bool active;
        bool[4] matrix; // Represents 4 slots (Index 0, 1 for Line 1; Index 2, 3 for Line 2)
        uint256 slotsFilled;
    }

    // Token used for payments (e.g., USDT)
    IERC20 public paymentToken;

    // Platform fee wallet (receives funds when uploader/referrer are not active or missing)
    address public platformFeeWallet;

    // Mapping to store user details by ID
    mapping(uint256 => User) private users;
    // Mapping from address to user ID
    mapping(address => uint256) public addressToId;
    // Mapping from user ID to address
    mapping(uint256 => address) public idToAddress;
    
    uint256 public lastUserId;
    
    // Plan values (USDT, 18 decimals by default)
    uint256[] public rankPrices;

    // --- EVENTS ---
    event UserRegistered(address indexed user, address indexed referrer, uint256 indexed userId, uint256 referrerId);
    event RankPurchased(address indexed user, uint256 indexed rankId, uint256 amount);
    event CommissionDistributed(address indexed recipient, address indexed fromUser, uint256 indexed rankId, uint256 amount, uint256 slotIndex);
    event AutoUpgraded(address indexed user, uint256 indexed nextRankId, uint256 cost);
    event RebornCreated(address indexed sponsor, address indexed recipient, uint256 indexed rankId, uint256 count);
    event BoardRecycled(address indexed user, uint256 indexed rankId);
    event FeePaidToPlatform(address indexed user, uint256 indexed rankId, uint256 amount, string reason);

    constructor(address _paymentToken, address _platformFeeWallet) {
        require(_paymentToken != address(0), "Invalid token address");
        require(_platformFeeWallet != address(0), "Invalid fee wallet");

        paymentToken = IERC20(_paymentToken);
        platformFeeWallet = _platformFeeWallet;

        // Initialize Rank prices (e.g., Rank 1 = 5 USDT, Rank 2 = 10 USDT, etc.)
        // Using standard 18 decimals. Adjust accordingly if USDT has 6 decimals (like on Ethereum/TRON)
        rankPrices.push(0);           // Index 0: placeholder
        rankPrices.push(5 ether);     // Rank 1: 5 USDT
        rankPrices.push(10 ether);    // Rank 2: 10 USDT
        rankPrices.push(20 ether);    // Rank 3: 20 USDT
        rankPrices.push(40 ether);    // Rank 4: 40 USDT
        rankPrices.push(80 ether);    // Rank 5: 80 USDT
        rankPrices.push(160 ether);   // Rank 6: 160 USDT
        rankPrices.push(320 ether);   // Rank 7: 320 USDT
        rankPrices.push(640 ether);   // Rank 8: 640 USDT

        // Register the platform's root account (ID 1)
        lastUserId++;
        User storage rootUser = users[lastUserId];
        rootUser.id = lastUserId;
        rootUser.wallet = _platformFeeWallet;
        rootUser.referrerId = 0;
        rootUser.currentMaxRank = rankPrices.length - 1;
        
        addressToId[_platformFeeWallet] = lastUserId;
        idToAddress[lastUserId] = _platformFeeWallet;

        // Activate all ranks for Root
        for (uint256 i = 1; i < rankPrices.length; i++) {
            rootUser.plans[i].active = true;
        }

        emit UserRegistered(_platformFeeWallet, address(0), lastUserId, 0);
    }

    /**
     * @notice Registers a new user with a referrer. Automatically purchases Rank 1 (5 USDT).
     */
    function register(uint256 referrerId) external nonReentrant {
        require(addressToId[msg.sender] == 0, "Already registered");
        require(referrerId > 0 && referrerId <= lastUserId, "Invalid referrer ID");

        // Transfer 5 USDT for registration/Rank 1 purchase
        uint256 rank1Price = rankPrices[1];
        require(paymentToken.transferFrom(msg.sender, address(this), rank1Price), "Payment failed");

        // Create new user record
        lastUserId++;
        User storage newUser = users[lastUserId];
        newUser.id = lastUserId;
        newUser.wallet = msg.sender;
        newUser.referrerId = referrerId;
        newUser.currentMaxRank = 1;
        newUser.plans[1].active = true;

        addressToId[msg.sender] = lastUserId;
        idToAddress[lastUserId] = msg.sender;

        emit UserRegistered(msg.sender, idToAddress[referrerId], lastUserId, referrerId);
        emit RankPurchased(msg.sender, 1, rank1Price);

        // Place user in referrer's Rank 1 matrix and process commissions
        fillSlotAndProcessCommissions(referrerId, 1, lastUserId);
    }

    /**
     * @notice Manually purchase a higher Rank.
     */
    function purchaseRank(uint256 rankId) external nonReentrant {
        uint256 userId = addressToId[msg.sender];
        require(userId != 0, "Register first");
        require(rankId > 1 && rankId < rankPrices.length, "Invalid Rank ID");
        require(!users[userId].plans[rankId].active, "Rank already active");
        require(users[userId].plans[rankId - 1].active, "Must purchase previous Rank first");

        uint256 price = rankPrices[rankId];
        require(paymentToken.transferFrom(msg.sender, address(this), price), "Payment failed");

        users[userId].plans[rankId].active = true;
        if (rankId > users[userId].currentMaxRank) {
            users[userId].currentMaxRank = rankId;
        }

        emit RankPurchased(msg.sender, rankId, price);

        // Process placement in upline's matrix
        uint256 referrerId = users[userId].referrerId;
        fillSlotAndProcessCommissions(referrerId, rankId, userId);
    }

    /**
     * @dev Places a user in the upline's matrix and distributes commission accordingly.
     */
    function fillSlotAndProcessCommissions(uint256 uplineId, uint256 rankId, uint256 purchaseUserId) internal {
        if (uplineId == 0) {
            // If upline doesn't exist, pay to platform
            require(paymentToken.transfer(platformFeeWallet, rankPrices[rankId]), "Fee payment failed");
            emit FeePaidToPlatform(idToAddress[purchaseUserId], rankId, rankPrices[rankId], "Upline is address 0");
            return;
        }

        User storage upline = users[uplineId];
        
        // Upline must have this Rank active, otherwise look for upline's referrer
        if (!upline.plans[rankId].active) {
            fillSlotAndProcessCommissions(upline.referrerId, rankId, purchaseUserId);
            return;
        }

        Plan storage plan = upline.plans[rankId];
        uint256 emptySlotIdx = 5; // Placeholder out of range

        // Find first empty slot in matrix
        for (uint256 i = 0; i < 4; i++) {
            if (!plan.matrix[i]) {
                emptySlotIdx = i;
                break;
            }
        }

        // Safe check
        if (emptySlotIdx >= 4) {
            // Already full, recycle board and place in next board of sponsor
            plan.matrix[0] = false;
            plan.matrix[1] = false;
            plan.matrix[2] = false;
            plan.matrix[3] = false;
            plan.slotsFilled = 0;
            emit BoardRecycled(upline.wallet, rankId);

            // Re-run placement
            fillSlotAndProcessCommissions(uplineId, rankId, purchaseUserId);
            return;
        }

        // Fill slot
        plan.matrix[emptySlotIdx] = true;
        plan.slotsFilled++;
        upline.downlinesCount++;

        uint256 planPrice = rankPrices[rankId];

        // 1. Commission Distribution Logic
        if (emptySlotIdx == 0 || emptySlotIdx == 1) {
            // Slot 1 & 2 (Index 0, 1): 50% commission goes to direct referrer of the matrix owner
            uint256 sponsorId = upline.referrerId;
            uint256 commissionAmount = planPrice / 2;

            if (sponsorId != 0 && users[sponsorId].plans[rankId].active) {
                users[sponsorId].totalIncome += commissionAmount;
                require(paymentToken.transfer(users[sponsorId].wallet, commissionAmount), "Commission transfer failed");
                emit CommissionDistributed(users[sponsorId].wallet, upline.wallet, rankId, commissionAmount, emptySlotIdx);
            } else {
                // If direct referrer is missing or inactive, pay platform
                require(paymentToken.transfer(platformFeeWallet, commissionAmount), "Platform commission failed");
                emit FeePaidToPlatform(upline.wallet, rankId, commissionAmount, "Sponsor inactive/missing on Slot 1/2");
            }

            // Note: The other 50% remains in the contract and is used/locked for special functions.
        } 
        else if (emptySlotIdx == 2 || emptySlotIdx == 3) {
            // Slot 3 & 4 (Index 2, 3): 50% commission goes up to upline's referrer (Level 2 upline)
            uint256 parentSponsorId = 0;
            if (upline.referrerId != 0) {
                parentSponsorId = users[upline.referrerId].referrerId;
            }
            
            uint256 commissionAmount = planPrice / 2;

            if (parentSponsorId != 0 && users[parentSponsorId].plans[rankId].active) {
                users[parentSponsorId].totalIncome += commissionAmount;
                require(paymentToken.transfer(users[parentSponsorId].wallet, commissionAmount), "Commission transfer failed");
                emit CommissionDistributed(users[parentSponsorId].wallet, upline.wallet, rankId, commissionAmount, emptySlotIdx);
            } else {
                require(paymentToken.transfer(platformFeeWallet, commissionAmount), "Platform commission failed");
                emit FeePaidToPlatform(upline.wallet, rankId, commissionAmount, "Parent sponsor inactive/missing on Slot 3/4");
            }

            // 2. AUTO UPGRADES (AUTO UP):
            // Check if both Slot 3 and 4 are filled.
            // If they are, trigger Auto Upgradability (AUTO UP) to the next Rank.
            // This is funded using the remaining 50% + 50% of Slot 3 & 4 (which is 100% of the next Rank cost).
            if (plan.matrix[2] && plan.matrix[3]) {
                uint256 nextRankId = rankId + 1;
                if (nextRankId < rankPrices.length) {
                    if (!upline.plans[nextRankId].active) {
                        // Activate next rank for the upline user automatically
                        upline.plans[nextRankId].active = true;
                        if (nextRankId > upline.currentMaxRank) {
                            upline.currentMaxRank = nextRankId;
                        }
                        emit AutoUpgraded(upline.wallet, nextRankId, rankPrices[nextRankId]);

                        // Place this upgraded user recursively into their referrer's next rank board
                        fillSlotAndProcessCommissions(upline.referrerId, nextRankId, uplineId);

                        // Trigger Reborn IDs in Rank 1 (Formula: 2^(nextRankId - 1))
                        uint256 rebornCount = 2**(nextRankId - 1);
                        triggerReborns(uplineId, rebornCount, 1);
                    }
                }
            }
        }

        // 3. RECYCLE RESET AND RANK 1 AUTO-REBORN RULE
        if (plan.matrix[0] && plan.matrix[1] && plan.matrix[2] && plan.matrix[3]) {
            // Reset the matrix for recycling
            plan.matrix[0] = false;
            plan.matrix[1] = false;
            plan.matrix[2] = false;
            plan.matrix[3] = false;
            plan.slotsFilled = 0;
            emit BoardRecycled(upline.wallet, rankId);

            // SPECIAL CONDITION: If Rank 1 is fully filled, pull the remaining 50% from Slot 1 & 2
            // (Which equals 100% of Rank 1 = 5 USDT) to sponsor and create 1 Auto Reborn in Rank 1 AND 1 Auto Reborn in Rank 2
            // both positioned recursively under the user's downline (the user's own Reborn IDs)!
            if (rankId == 1) {
                // Sponsor 1 Reborn ID in Rank 1 under themselves
                triggerReborns(uplineId, 1, 1);
                // Sponsor 1 Reborn ID in Rank 2 under themselves
                triggerReborns(uplineId, 1, 2);
            }
        }
    }

    /**
     * @dev Places reborn IDs recursively into the downline network of the sponsor to help them fill slots.
     */
    function triggerReborns(uint256 sponsorId, uint256 count, uint256 rankId) internal {
        uint256 rebornsLeft = count;

        // Traverse downlines in a breadth-first manner to find candidates
        // In Solidity, we use a queue pattern using a dynamic/memory array or we search iteratively
        // To prevent high gas consumption or infinite loops, we cap the search level.
        // We look for direct downlines first, then deeper downlines.
        
        uint256[] memory downlineQueue = new uint256[](lastUserId);
        uint256 head = 0;
        uint256 tail = 0;

        // Populate initial level (direct downlines of sponsor)
        for (uint256 i = 1; i <= lastUserId; i++) {
            if (users[i].referrerId == sponsorId && users[i].plans[rankId].active) {
                downlineQueue[tail] = i;
                tail++;
            }
        }

        // Queue-based BFS to fill the downlines' empty matrices
        while (head < tail && rebornsLeft > 0) {
            uint256 currentId = downlineQueue[head];
            head++;

            Plan storage p = users[currentId].plans[rankId];
            
            // Check if there are empty slots
            bool hasEmptySlot = false;
            for (uint256 i = 0; i < 4; i++) {
                if (!p.matrix[i]) {
                    hasEmptySlot = true;
                    break;
                }
            }

            if (hasEmptySlot) {
                fillSlotAndProcessCommissions(currentId, rankId, sponsorId);
                rebornsLeft--;
                
                if (rebornsLeft == 0) break;
            }

            // Queue up this user's downlines for deeper search
            for (uint256 i = 1; i <= lastUserId; i++) {
                if (users[i].referrerId == currentId && users[i].plans[rankId].active) {
                    downlineQueue[tail] = i;
                    tail++;
                }
            }
        }

        // Fallback: If reborns are still left (e.g., no active downlines yet),
        // fill the slots of any active users in the system to help the community.
        if (rebornsLeft > 0) {
            for (uint256 i = 1; i <= lastUserId; i++) {
                if (rebornsLeft == 0) break;
                if (i != sponsorId && users[i].plans[rankId].active) {
                    Plan storage p = users[i].plans[rankId];
                    bool hasEmptySlot = false;
                    for (uint256 j = 0; j < 4; j++) {
                        if (!p.matrix[j]) {
                            hasEmptySlot = true;
                            break;
                        }
                    }
                    if (hasEmptySlot) {
                        fillSlotAndProcessCommissions(i, rankId, sponsorId);
                        rebornsLeft--;
                    }
                }
            }
        }

        emit RebornCreated(idToAddress[sponsorId], idToAddress[sponsorId], rankId, count);
    }

    // --- VIEW FUNCTIONS ---

    /**
     * @notice Get user account basic info.
     */
    function getUser(uint256 userId) external view returns (
        uint256 id,
        address wallet,
        uint256 referrerId,
        uint256 totalIncome,
        uint256 downlinesCount,
        uint256 currentMaxRank
    ) {
        User storage u = users[userId];
        return (u.id, u.wallet, u.referrerId, u.totalIncome, u.downlinesCount, u.currentMaxRank);
    }

    /**
     * @notice Get matrix slots detail of a specific rank of a user.
     */
    function getUserPlanMatrix(uint256 userId, uint256 rankId) external view returns (
        bool active,
        bool[4] memory matrix,
        uint256 slotsFilled
    ) {
        Plan storage p = users[userId].plans[rankId];
        return (p.active, p.matrix, p.slotsFilled);
    }

    // --- OWNER FUNCTIONS ---
    
    /**
     * @notice Allows owner to update rank prices if necessary.
     */
    function updateRankPrice(uint256 rankId, uint256 newPrice) external onlyOwner {
        require(rankId > 0 && rankId < rankPrices.length, "Invalid rank");
        rankPrices[rankId] = newPrice;
    }
}

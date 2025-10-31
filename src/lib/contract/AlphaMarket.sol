// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 AlphaMarketERC20_UMA.sol

 - One-vs-many predictive alpha market using ERC20 (e.g., USDC).
 - UMA Optimistic Oracle v2 integration for settling binary outcomes (YES_OR_NO_QUERY).
*/

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// See UMA docs for full interface
interface IOptimisticOracleV2 {
    function requestPrice(
        bytes32 identifier,
        uint256 timestamp,
        bytes calldata ancillaryData,
        IERC20 currency,
        uint256 reward
    ) external returns (uint256 totalBond);

    function hasPrice(address requester, bytes32 identifier, uint256 timestamp, bytes calldata ancillaryData)
        external
        view
        returns (bool);

    function settleAndGetPrice(bytes32 identifier, uint256 timestamp, bytes calldata ancillaryData)
        external
        returns (int256);

    function stampAncillaryData(bytes calldata ancillaryData, address requester) external pure returns (bytes memory);
}

contract RaptorAplhaMarket is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --------------------------
    // State & config
    IOptimisticOracleV2 public immutable optimisticOracle;
    IERC20 public stakeToken;
    uint8 public stakeTokenDecimals;

    uint256 public platformFeeBps = 50; // 0.5%
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public feeVault;

    constructor(address _optimisticOracle, address _stakeToken) Ownable(msg.sender) {
        require(_optimisticOracle != address(0), "oo zero");
        require(_stakeToken != address(0), "token zero");

        optimisticOracle = IOptimisticOracleV2(_optimisticOracle);
        stakeToken = IERC20(_stakeToken);

        uint8 decimalsLocal = 18;
        try IERC20Metadata(_stakeToken).decimals() returns (uint8 d) {
            decimalsLocal = d;
        } catch {
            decimalsLocal = 18;
        }
        stakeTokenDecimals = decimalsLocal;
    }

    // -------- Events ----------
    event AlphaCreated(
        uint256 indexed alphaId,
        address indexed asset,
        string ticker,
        address indexed creator,
        uint256 stake,
        uint256 targetPrice,
        uint256 expiry
    );
    event BetAgainst(uint256 indexed alphaId, address indexed bettor, uint256 amount);
    event AlphaSettled(uint256 indexed alphaId, bool creatorWon, int256 settlementValue, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount);
    event PlatformFeeUpdated(uint256 newFeeBps);
    event StakeTokenUpdated(address indexed oldToken, address indexed newToken, uint8 newDecimals);
    event FeeWithdrawn(address indexed to, uint256 amount);
    event AlphaPriceRequested(uint256 indexed alphaId, uint256 expiry, bytes ancillaryData, address requester);

    // -------- Structs ----------
    struct Opponent {
        address addr;
        uint256 amount;
        uint256 fid;
    }

    struct Creator {
        address addr;
    }

    struct Alpha {
        address asset; // contract address for the asset
        string ticker; // ticker for display
        string tokenURI;
        address creator;
        uint256 stake; // creator stake
        uint256 totalOpponentsStaked;
        uint256 totalStaked; // creator stake + opponents
        uint256 targetPrice; // price threshold in the same units you decide (e.g., price * 1e6)
        uint256 expiry; // timestamp the prediction resolves at
        bool settled;
        bool creatorWon;
        uint256 opponentCount;
    }

    // -------- Storage ----------
    mapping(uint256 => Alpha) public alphas;
    uint256 public nextAlphaId;
    mapping(uint256 => Opponent[]) private alphaOpponents;
    mapping(address => uint256) public withdrawableToken;
    // helper mapping to quickly lookup user's total stake in an alpha (creator stake is stored in Alpha.stake)
    mapping(uint256 => mapping(address => uint256)) public userStakeInAlpha;
    mapping(uint256 => bool) public priceRequested;
    mapping(address => uint256[]) public userBets;

    // -------- Errors ----------
    error AlphaNotFound();
    error AlreadySettled();
    error NotExpired();
    error ZeroAmount();
    error InsufficientFee();
    error CreatorCannotBet();
    error NotSettleable();
    error AlreadyRequested();
    error PriceNotRequested();

    // -------- Admin ----------
    function updateStakeToken(address newToken) external onlyOwner {
        require(newToken != address(0), "token 0");
        address old = address(stakeToken);
        stakeToken = IERC20(newToken);
        uint8 decimalsLocal = 18;
        try IERC20Metadata(newToken).decimals() returns (uint8 d) {
            decimalsLocal = d;
        } catch {
            decimalsLocal = 18;
        }
        stakeTokenDecimals = decimalsLocal;
        emit StakeTokenUpdated(old, newToken, decimalsLocal);
    }

    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "fee too high"); // max 10%
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }

    // -------- Create Alpha ----------
    /// @notice Create an alpha. Provide on-chain asset address and a ticker
    function createAlphaERC20(
        address asset,
        string calldata ticker,
        uint256 targetPrice,
        uint256 expiry,
        uint256 stakeAmount,
        string calldata _tokenURI
    ) external nonReentrant {
        if (asset == address(0)) revert ZeroAmount();
        if (stakeAmount == 0) revert ZeroAmount();
        if (expiry <= block.timestamp) revert NotExpired();

        stakeToken.safeTransferFrom(msg.sender, address(this), stakeAmount);

        uint256 id = nextAlphaId++;
        alphas[id] = Alpha({
            asset: asset,
            ticker: ticker,
            tokenURI: _tokenURI,
            creator: msg.sender,
            stake: stakeAmount,
            totalOpponentsStaked: 0,
            totalStaked: stakeAmount,
            targetPrice: targetPrice,
            expiry: expiry,
            settled: false,
            creatorWon: false,
            opponentCount: 0
        });

        userStakeInAlpha[id][msg.sender] = stakeAmount;

        emit AlphaCreated(id, asset, ticker, msg.sender, stakeAmount, targetPrice, expiry);
    }

    // -------- Opponent Bets ----------
    function betAgainstERC20(uint256 alphaId, uint256 _fid) external nonReentrant {
        if (alphaId >= nextAlphaId) revert AlphaNotFound();
        Alpha storage a = alphas[alphaId];
        if (a.settled) revert AlreadySettled();
        if (block.timestamp >= a.expiry) revert NotExpired();
        if (msg.sender == a.creator) revert CreatorCannotBet();

        uint256 requiredStake = (a.stake * 10) / 100; // 10% of creator stake
        stakeToken.safeTransferFrom(msg.sender, address(this), requiredStake);

        a.totalOpponentsStaked += requiredStake;
        a.totalStaked += requiredStake;
        a.opponentCount += 1;
        alphaOpponents[alphaId].push(Opponent({addr: msg.sender, amount: requiredStake, fid: _fid}));
        userStakeInAlpha[alphaId][msg.sender] += requiredStake;
        userBets[msg.sender].push(alphaId);

        emit BetAgainst(alphaId, msg.sender, requiredStake);
    }

    // --------- Request price form UMA OO after expiration hits ----------
    function requestAlphaSettlement(uint256 alphaId) external nonReentrant {
        Alpha storage a = alphas[alphaId];
        if (a.settled) revert AlreadySettled();
        if (block.timestamp <= a.expiry) revert NotExpired();
        if (priceRequested[alphaId]) revert AlreadyRequested();

        bytes memory rawAncillary = abi.encodePacked(
            "Did ",
            a.ticker,
            " (",
            toAsciiString(a.asset),
            ") close at or above ",
            uint2str(a.targetPrice),
            " at timestamp ",
            uint2str(a.expiry),
            "?"
        );

        bytes memory stamped = optimisticOracle.stampAncillaryData(rawAncillary, address(this));
        bytes32 identifier = keccak256(abi.encodePacked("YES_OR_NO_QUERY"));

        optimisticOracle.requestPrice(identifier, a.expiry, stamped, stakeToken, 0);

        priceRequested[alphaId] = true;
        emit AlphaPriceRequested(alphaId, a.expiry, stamped, msg.sender);
    }

    // --------- settels price after outcome is returned from UMA ----------
    function finalizeAlphaSettlement(uint256 alphaId) external nonReentrant {
        Alpha storage a = alphas[alphaId];
        if (a.settled) revert AlreadySettled();
        if (!priceRequested[alphaId]) revert PriceNotRequested();

        bytes memory rawAncillary = abi.encodePacked(
            "Did ",
            a.ticker,
            " (",
            toAsciiString(a.asset),
            ") close at or above ",
            uint2str(a.targetPrice),
            " at timestamp ",
            uint2str(a.expiry),
            "?"
        );
        bytes memory stamped = optimisticOracle.stampAncillaryData(rawAncillary, address(this));
        bytes32 identifier = keccak256(abi.encodePacked("YES_OR_NO_QUERY"));

        if (!optimisticOracle.hasPrice(address(this), identifier, a.expiry, stamped)) {
            revert NotSettleable();
        }

        int256 outcome = optimisticOracle.settleAndGetPrice(identifier, a.expiry, stamped);
        bool creatorWon = outcome > 0;
        a.creatorWon = creatorWon;
        a.settled = true;

        // payout logic
        if (creatorWon) {
            uint256 gross = a.totalStaked;
            uint256 feeAmt = (gross * platformFeeBps) / BPS_DENOMINATOR;
            withdrawableToken[a.creator] += gross - feeAmt;
            feeVault += feeAmt;
        } else {
            uint256 gross = a.stake;
            uint256 feeAmt = (gross * platformFeeBps) / BPS_DENOMINATOR;
            feeVault += feeAmt;
            uint256 eachShare = (gross - feeAmt) / a.opponentCount;
            for (uint256 i = 0; i < alphaOpponents[alphaId].length; i++) {
                withdrawableToken[alphaOpponents[alphaId][i].addr] += eachShare;
            }
        }

        emit AlphaSettled(alphaId, creatorWon, outcome, block.timestamp);
    }

    /// @notice Returns true if the UMA price request for the alpha is resolved
    function isAlphaResolved(uint256 alphaId) external view returns (bool) {
        Alpha storage a = alphas[alphaId];
        if (a.settled) return true; // Already settled on-chain

        // Construct the UMA ancillary data (must match what you used in requestPrice)
        bytes memory rawAncillary = abi.encodePacked(
            "Did ",
            a.ticker,
            " (",
            toAsciiString(a.asset),
            ") close at or above ",
            uint2str(a.targetPrice),
            " at timestamp ",
            uint2str(a.expiry),
            "?"
        );

        bytes32 identifier = keccak256(abi.encodePacked("YES_OR_NO_QUERY"));
        return optimisticOracle.hasPrice(address(this), identifier, a.expiry, rawAncillary);
    }

    // -------- Withdraw ----------
    function withdrawToken() external nonReentrant {
        uint256 amount = withdrawableToken[msg.sender];
        require(amount > 0, "no balance");
        withdrawableToken[msg.sender] = 0;
        stakeToken.safeTransfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }

    function getWithdrawableAmount(address user) external view returns (uint256) {
        return withdrawableToken[user];
    }

    // -------- Fee management ----------
    function withdrawFees(address to) external onlyOwner {
        require(to != address(0), "invalid");
        uint256 amt = feeVault;
        feeVault = 0;
        stakeToken.safeTransfer(to, amt);
        emit FeeWithdrawn(to, amt);
    }

    // -------- Views (paging-friendly for UI) ----------
    function getAlpha(uint256 alphaId) external view returns (Alpha memory) {
        return alphas[alphaId];
    }

    /// @notice Return a page of alphas. Use for UI (avoid returning huge arrays).
    function getAlphas(uint256 start, uint256 count) external view returns (Alpha[] memory list) {
        uint256 end = start + count;
        if (end > nextAlphaId) end = nextAlphaId;
        // if (start >= end) return new Alpha();
        uint256 len = end - start;
        list = new Alpha[](len);
        for (uint256 i = 0; i < len; i++) {
            list[i] = alphas[start + i];
        }
        return list;
    }

    function getOpponents(uint256 alphaId) external view returns (Opponent[] memory) {
        return alphaOpponents[alphaId];
    }

    function getUserStakeInAlpha(uint256 alphaId, address user) external view returns (uint256) {
        return userStakeInAlpha[alphaId][user];
    }

    /// return key live totals for UI: creatorStake, totalOpponents, totalStaked, opponentCount
    function getLiveStats(uint256 alphaId)
        external
        view
        returns (uint256 creatorStake, uint256 totalOpponents, uint256 totalStaked, uint256 opponentCount)
    {
        Alpha memory a = alphas[alphaId];
        return (a.stake, a.totalOpponentsStaked, a.totalStaked, a.opponentCount);
    }

    // -------- Admin emergency ----------
    function emergencyWithdrawToken(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "invalid to");
        stakeToken.safeTransfer(to, amount);
    }

    // -------- Helpers (string formatting) ----------
    // convert uint to string (small helper)
    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = uint8(48 + uint256(_i % 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        str = string(bstr);
    }

    // convert address to ASCII string (0x + hex)
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42);
        bytes memory hexSymbols = "0123456789abcdef";
        s[0] = "0";
        s[1] = "x";
        uint256 v = uint256(uint160(x));
        for (uint256 i = 0; i < 20; i++) {
            uint256 b = (v >> (8 * (19 - i))) & 0xff;
            s[2 + i * 2] = hexSymbols[b >> 4];
            s[3 + i * 2] = hexSymbols[b & 0x0f];
        }
        return string(s);
    }
}

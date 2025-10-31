import { readContract, writeContract } from "@wagmi/core";
import { config } from "../components/providers/WagmiProvider";
import {
  ALPHA_CONTRACT_ADDRESS,
  ALPHA_CONTRACT_ABI,
  ERC20_ABI,
} from "./otherConstants";
import { parseTokenAmount } from "./contract";

// Get wagmi config from adapter
const wagmiConfig = config;

// Contract read functions
export const contractReads = {
  // Alpha contract reads
  async getAlpha(alphaId: number) {
    console.log("getAlpha", ALPHA_CONTRACT_ADDRESS);
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "getAlpha",
      args: [BigInt(alphaId)],
    });
  },

  async getAlphas(start: number, count: number) {
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "getAlphas",
      args: [BigInt(start), BigInt(count)],
    });
  },

  async getNextAlphaId() {
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "nextAlphaId",
    });
  },

  async getLiveStats(alphaId: number) {
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "getLiveStats",
      args: [BigInt(alphaId)],
    });
  },

  async getOpponents(alphaId: number) {
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "getOpponents",
      args: [BigInt(alphaId)],
    });
  },

  async getUserStakeInAlpha(alphaId: number, user: string) {
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "getUserStakeInAlpha",
      args: [BigInt(alphaId), user as `0x${string}`],
    });
  },

  async getWithdrawableAmount(user: string) {
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "getWithdrawableAmount",
      args: [user as `0x${string}`],
    });
  },

  async isAlphaResolved(alphaId: number) {
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "isAlphaResolved",
      args: [BigInt(alphaId)],
    });
  },

  async getStakeToken() {
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "stakeToken",
    });
  },

  async getStakeTokenDecimals() {
    return await readContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "stakeTokenDecimals",
    });
  },

  // ERC20 token reads
  async getTokenBalance(tokenAddress: string, user: string) {
    return await readContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [user as `0x${string}`],
    });
  },

  async getTokenAllowance(
    tokenAddress: string,
    owner: string,
    spender: string
  ) {
    return await readContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [owner as `0x${string}`, spender as `0x${string}`],
    });
  },

  async getTokenDecimals(tokenAddress: string) {
    return await readContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "decimals",
    });
  },

  async getTokenSymbol(tokenAddress: string) {
    return await readContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "symbol",
    });
  },

  async getTokenName(tokenAddress: string) {
    return await readContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "name",
    });
  },
};

// Contract write functions
export const contractWrites = {
  // Alpha contract writes
  async createAlphaERC20(
    asset: string,
    ticker: string,
    targetPrice: string,
    expiry: number,
    stakeAmount: string,
    tokenURI: string
  ) {
    // Always store target price with 18 decimals for consistency
    const parsedTargetPrice = parseTokenAmount(targetPrice, 18);
    const parsedStakeAmount = parseTokenAmount(stakeAmount, 6); // USDC has 6 decimals

    return await writeContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "createAlphaERC20",
      args: [
        asset,
        ticker,
        parsedTargetPrice,
        BigInt(expiry),
        parsedStakeAmount,
        tokenURI,
      ],
      gas: BigInt(500000), // Set gas limit
    });
  },

  async betAgainstERC20(alphaId: number, bettorFid: number) {
    return await writeContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "betAgainstERC20",
      args: [BigInt(alphaId), BigInt(bettorFid)],
      gas: BigInt(300000),
    });
  },

  async settleAlphaWithUMA(alphaId: number) {
    return await writeContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "settleAlphaWithUMA",
      args: [BigInt(alphaId)],
      gas: BigInt(400000),
    });
  },

  async withdrawToken() {
    return await writeContract(wagmiConfig, {
      address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
      abi: ALPHA_CONTRACT_ABI,
      functionName: "withdrawToken",
      args: [],
      gas: BigInt(200000),
    });
  },

  // ERC20 token writes
  async approveToken(
    tokenAddress: string,
    spender: string,
    amount: string,
    decimals: number
  ) {
    const parsedAmount = parseTokenAmount(amount, decimals);

    return await writeContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender as `0x${string}`, parsedAmount],
      gas: BigInt(100000),
    });
  },
};

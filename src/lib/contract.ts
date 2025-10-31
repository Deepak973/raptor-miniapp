import { Contract, ethers } from "ethers";
import { ALPHA_CONTRACT_ADDRESS } from "./otherConstants";
import AlphaMarketERC20_UMA_ABI from "./abi/AlphaMarketERC20_UMA.json";

// Contract ABI type
export const ALPHA_CONTRACT_ABI = AlphaMarketERC20_UMA_ABI;

// Contract helper function
export const getAlphaContract = (
  signerOrProvider: ethers.Signer | ethers.Provider
) => {
  return new Contract(
    ALPHA_CONTRACT_ADDRESS,
    ALPHA_CONTRACT_ABI,
    signerOrProvider
  );
};

// Contract interface types based on the Solidity contract
export interface Alpha {
  asset: string;
  ticker: string;
  tokenURI: string;
  creator: string;
  stake: bigint;
  totalOpponentsStaked: bigint;
  totalStaked: bigint;
  targetPrice: bigint;
  expiry: bigint;
  settled: boolean;
  creatorWon: boolean;
  opponentCount: bigint;
}

export interface Opponent {
  addr: string;
  amount: bigint;
  fid: bigint;
}

export interface LiveStats {
  creatorStake: bigint;
  totalOpponents: bigint;
  totalStaked: bigint;
  opponentCount: bigint;
}

// Contract interaction helpers
export class AlphaContractService {
  private contract: Contract;

  constructor(signerOrProvider: ethers.Signer | ethers.Provider) {
    this.contract = getAlphaContract(signerOrProvider);
  }

  // Read functions
  async getAlpha(alphaId: number): Promise<Alpha> {
    return await this.contract.getAlpha(alphaId);
  }

  async getAlphas(start: number, count: number): Promise<Alpha[]> {
    return await this.contract.getAlphas(start, count);
  }

  async getNextAlphaId(): Promise<bigint> {
    return await this.contract.nextAlphaId();
  }

  async getLiveStats(alphaId: number): Promise<LiveStats> {
    return await this.contract.getLiveStats(alphaId);
  }

  async getOpponents(alphaId: number): Promise<Opponent[]> {
    return await this.contract.getOpponents(alphaId);
  }

  async getUserStakeInAlpha(alphaId: number, user: string): Promise<bigint> {
    return await this.contract.getUserStakeInAlpha(alphaId, user);
  }

  async getWithdrawableAmount(user: string): Promise<bigint> {
    return await this.contract.getWithdrawableAmount(user);
  }

  async isAlphaResolved(alphaId: number): Promise<boolean> {
    return await this.contract.isAlphaResolved(alphaId);
  }

  async getStakeToken(): Promise<string> {
    return await this.contract.stakeToken();
  }

  async getStakeTokenDecimals(): Promise<number> {
    return await this.contract.stakeTokenDecimals();
  }

  // Write functions
  async createAlphaERC20(
    asset: string,
    ticker: string,
    targetPrice: bigint,
    expiry: bigint,
    stakeAmount: bigint,
    tokenURI: string
  ) {
    return await this.contract.createAlphaERC20(
      asset,
      ticker,
      targetPrice,
      expiry,
      stakeAmount,
      tokenURI
    );
  }

  async betAgainstERC20(alphaId: number) {
    return await this.contract.betAgainstERC20(alphaId);
  }

  async settleAlphaWithUMA(alphaId: number) {
    return await this.contract.settleAlphaWithUMA(alphaId);
  }

  async withdrawToken() {
    return await this.contract.withdrawToken();
  }

  // Event filters
  getAlphaCreatedFilter() {
    return this.contract.filters.AlphaCreated();
  }

  getBetAgainstFilter(alphaId?: number) {
    return this.contract.filters.BetAgainst(alphaId);
  }

  getAlphaSettledFilter(alphaId?: number) {
    return this.contract.filters.AlphaSettled(alphaId);
  }

  getWithdrawalFilter(user?: string) {
    return this.contract.filters.Withdrawal(user);
  }
}

// Utility functions for formatting and calculations
export const formatTokenAmount = (amount: bigint, decimals: number): string => {
  return ethers.formatUnits(amount, decimals);
};

export const parseTokenAmount = (amount: string, decimals: number): bigint => {
  return ethers.parseUnits(amount, decimals);
};

export const calculateRequiredStake = (creatorStake: bigint): bigint => {
  return (creatorStake * BigInt(10)) / BigInt(100); // 10% of creator stake
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimestamp = (timestamp: bigint): string => {
  return new Date(Number(timestamp) * 1000).toLocaleString();
};

export const isExpired = (expiry: bigint): boolean => {
  return BigInt(Math.floor(Date.now() / 1000)) >= expiry;
};

export const getTimeUntilExpiry = (expiry: bigint): string => {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const diff = expiry - now;

  if (diff <= 0) return "Expired";

  const days = Number(diff) / (24 * 60 * 60);
  const hours = (Number(diff) % (24 * 60 * 60)) / (60 * 60);
  const minutes = (Number(diff) % (60 * 60)) / 60;

  if (days >= 1) return `${Math.floor(days)}d ${Math.floor(hours)}h`;
  if (hours >= 1) return `${Math.floor(hours)}h ${Math.floor(minutes)}m`;
  return `${Math.floor(minutes)}m`;
};

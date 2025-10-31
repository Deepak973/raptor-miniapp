import { useReadContract } from "wagmi";
import {
  ALPHA_CONTRACT_ADDRESS,
  ALPHA_CONTRACT_ABI,
  ERC20_ABI,
} from "../otherConstants";
import { Alpha } from "../contract";

// Alpha contract read hooks
export const useAlpha = (alphaId: number) => {
  const result = useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "getAlpha",
    args: [BigInt(alphaId)],
  });

  return {
    ...result,
    data: result.data as Alpha | undefined,
  };
};

export const useAlphas = (start: number, count: number) => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "getAlphas",
    args: [BigInt(start), BigInt(count)],
  });
};

export const useNextAlphaId = () => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "nextAlphaId",
  });
};

export const useLiveStats = (alphaId: number) => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "getLiveStats",
    args: [BigInt(alphaId)],
  });
};

export const useOpponents = (alphaId: number) => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "getOpponents",
    args: [BigInt(alphaId)],
  });
};

export const useUserStakeInAlpha = (alphaId: number, user: string) => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "getUserStakeInAlpha",
    args: [BigInt(alphaId), user as `0x${string}`],
  });
};

export const useWithdrawableAmount = (user: string) => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "getWithdrawableAmount",
    args: [user as `0x${string}`],
  });
};

export const useIsAlphaResolved = (alphaId: number) => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "isAlphaResolved",
    args: [BigInt(alphaId)],
  });
};

export const useIsPriceRequested = (alphaId: number) => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "priceRequested",
    args: [BigInt(alphaId)],
  });
};

export const useUserBets = (user: string) => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "userBets",
    args: [user as `0x${string}`],
  });
};

export const useStakeToken = () => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "stakeToken",
  });
};

export const useStakeTokenDecimals = () => {
  return useReadContract({
    address: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALPHA_CONTRACT_ABI,
    functionName: "stakeTokenDecimals",
  });
};

// ERC20 token read hooks
export const useTokenBalance = (tokenAddress: string, user: string) => {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [user as `0x${string}`],
  });
};

export const useTokenAllowance = (
  tokenAddress: string,
  owner: string,
  spender: string
) => {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner as `0x${string}`, spender as `0x${string}`],
  });
};

export const useTokenDecimals = (tokenAddress: string) => {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  });
};

export const useTokenSymbol = (tokenAddress: string) => {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol",
  });
};

export const useTokenName = (tokenAddress: string) => {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "name",
  });
};

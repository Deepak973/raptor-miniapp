import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { contractReads } from "../contractService";

export const useWithdrawableAmount = () => {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["withdrawableAmount", address],
    queryFn: async (): Promise<bigint> => {
      if (!address) throw new Error("No address");

      return (await contractReads.getWithdrawableAmount(address)) as bigint;
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};

export const useStakeTokenInfo = () => {
  return useQuery({
    queryKey: ["stakeTokenInfo"],
    queryFn: async (): Promise<{ address: string; decimals: number }> => {
      const [address, decimals] = await Promise.all([
        contractReads.getStakeToken(),
        contractReads.getStakeTokenDecimals(),
      ]);

      console.log("address", address);
      console.log("decimals", decimals);

      return { address: address as string, decimals: decimals as number };
    },
    staleTime: 300000, // 5 minutes
  });
};

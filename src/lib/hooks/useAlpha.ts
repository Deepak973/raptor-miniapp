import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { useMemo } from "react";
import { Alpha, LiveStats, Opponent } from "../contract";
import { contractReads } from "../contractService";

export const useAlpha = (alphaId: number) => {
  const publicClient = usePublicClient();
  const hasPublicClient = !!publicClient;
  const isValidAlphaId = alphaId >= 0;

  return useQuery({
    queryKey: useMemo(() => ["alpha", alphaId], [alphaId]),
    queryFn: async (): Promise<Alpha> => {
      if (!publicClient) throw new Error("No public client");

      return (await contractReads.getAlpha(alphaId)) as Alpha;
    },
    enabled: hasPublicClient && isValidAlphaId,
    staleTime: 30000, // 30 seconds
  });
};

export const useAlphaLiveStats = (alphaId: number) => {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["alphaStats", alphaId],
    queryFn: async (): Promise<LiveStats> => {
      if (!publicClient) throw new Error("No public client");

      return (await contractReads.getLiveStats(alphaId)) as LiveStats;
    },
    enabled: !!publicClient && alphaId >= 0,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
};

export const useAlphaOpponents = (alphaId: number) => {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["alphaOpponents", alphaId],
    queryFn: async (): Promise<Opponent[]> => {
      if (!publicClient) throw new Error("No public client");

      return (await contractReads.getOpponents(alphaId)) as Opponent[];
    },
    enabled: !!publicClient && alphaId >= 0,
    staleTime: 30000, // 30 seconds
  });
};

export const useUserStakeInAlpha = (alphaId: number) => {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["userStakeInAlpha", alphaId, address],
    queryFn: async (): Promise<bigint> => {
      if (!publicClient || !address)
        throw new Error("No public client or address");

      return (await contractReads.getUserStakeInAlpha(
        alphaId,
        address
      )) as bigint;
    },
    enabled: !!publicClient && !!address && alphaId >= 0,
    staleTime: 30000, // 30 seconds
  });
};

export const useIsAlphaResolved = (alphaId: number) => {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["isAlphaResolved", alphaId],
    queryFn: async (): Promise<boolean> => {
      if (!publicClient) throw new Error("No public client");

      return (await contractReads.isAlphaResolved(alphaId)) as boolean;
    },
    enabled: !!publicClient && alphaId >= 0,
    staleTime: 30000, // 30 seconds
  });
};

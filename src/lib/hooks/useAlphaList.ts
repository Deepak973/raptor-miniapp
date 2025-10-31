import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { useMemo } from "react";
import { Alpha } from "../contract";
import { contractReads } from "../contractService";

export const useAlphaList = (start: number = 0, count: number = 20) => {
  const publicClient = usePublicClient();
  const hasPublicClient = !!publicClient;

  return useQuery({
    queryKey: useMemo(() => ["alphas", start, count], [start, count]),
    queryFn: async (): Promise<Alpha[]> => {
      if (!publicClient) throw new Error("No public client");

      return (await contractReads.getAlphas(start, count)) as Alpha[];
    },
    enabled: hasPublicClient,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};

export const useNextAlphaId = () => {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["nextAlphaId"],
    queryFn: async (): Promise<bigint> => {
      if (!publicClient) throw new Error("No public client");

      return (await contractReads.getNextAlphaId()) as bigint;
    },
    enabled: !!publicClient,
    staleTime: 60000, // 1 minute
  });
};

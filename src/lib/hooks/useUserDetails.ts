import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  bio?: string;
}

interface UseUserDetailsOptions {
  fids: number[];
  enabled?: boolean;
}

export const useUserDetails = ({
  fids,
  enabled = true,
}: UseUserDetailsOptions) => {
  const sortedFids = useMemo(() => [...fids].sort((a, b) => a - b), [fids]);
  const fidsKey = useMemo(() => sortedFids.join(","), [sortedFids]);
  const hasFids = sortedFids.length > 0;
  const queryKey = useMemo(() => ["userDetails", fidsKey], [fidsKey]);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<NeynarUser[]> => {
      if (sortedFids.length === 0) return [];

      const fidsParam = sortedFids.join(",");
      const response = await fetch(`/api/users?fids=${fidsParam}`);

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data = await response.json();
      return data.users || [];
    },
    enabled: enabled && hasFids,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSingleUserDetail = (fid: number | undefined | null) => {
  const { data: users, ...rest } = useUserDetails({
    fids: fid ? [fid] : [],
    enabled: !!fid,
  });

  return {
    ...rest,
    data: users?.[0] || null,
  };
};

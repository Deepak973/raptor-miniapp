import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  bio?: string;
  custody_address?: string;
  verified_addresses?: {
    eth_addresses?: string[];
  };
}

interface UseUserDetailsByAddressOptions {
  addresses: string[];
  enabled?: boolean;
}

export const useUserDetailsByAddress = ({
  addresses,
  enabled = true,
}: UseUserDetailsByAddressOptions) => {
  const normalizedAddresses = useMemo(() => {
    return addresses
      .map((addr) => addr.toLowerCase())
      .filter((addr) => addr && addr.startsWith("0x"))
      .sort();
  }, [addresses]);

  const addressesKey = useMemo(
    () => normalizedAddresses.join(","),
    [normalizedAddresses]
  );

  const hasAddresses = normalizedAddresses.length > 0;
  const queryKey = useMemo(
    () => ["userDetailsByAddress", addressesKey],
    [addressesKey]
  );

  return useQuery({
    queryKey,
    queryFn: async (): Promise<Map<string, NeynarUser>> => {
      if (normalizedAddresses.length === 0) return new Map();

      const addressesParam = normalizedAddresses.join(",");
      const response = await fetch(`/api/users?addresses=${addressesParam}`);

      if (!response.ok) {
        throw new Error("Failed to fetch user details by address");
      }

      const data = await response.json();
      const usersByAddress = data.usersByAddress || {};

      // Convert to Map with normalized addresses as keys
      const addressToUser = new Map<string, NeynarUser>();
      for (const [address, users] of Object.entries(usersByAddress)) {
        const normalizedAddr = address.toLowerCase();
        const userArray = users as NeynarUser[];
        if (userArray && userArray.length > 0) {
          // Use the first user if multiple found
          addressToUser.set(normalizedAddr, userArray[0]);
        }
      }

      return addressToUser;
    },
    enabled: enabled && hasAddresses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSingleUserByAddress = (address: string | undefined | null) => {
  const { data: addressToUser, ...rest } = useUserDetailsByAddress({
    addresses: address ? [address] : [],
    enabled: !!address,
  });

  const user = address ? addressToUser?.get(address.toLowerCase()) : null;

  return {
    ...rest,
    data: user || null,
  };
};

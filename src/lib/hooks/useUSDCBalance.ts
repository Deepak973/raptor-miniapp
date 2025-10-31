import { useAccount } from "wagmi";
import { useTokenBalance } from "./useContractReads";
import { useStakeTokenInfo } from "./useUserData";

export const useUSDCBalance = () => {
  const { address } = useAccount();
  const { data: stakeTokenInfo } = useStakeTokenInfo();

  const {
    data: balance,
    isLoading,
    error,
  } = useTokenBalance(stakeTokenInfo?.address || "", address || "");

  console.log("stakeTokenInfo", stakeTokenInfo);
  console.log("address", address);
  console.log("balance", balance);

  return {
    balance: balance as bigint | undefined,
    isLoading,
    error,
    decimals: stakeTokenInfo?.decimals || 6,
    symbol: "USDC",
  };
};

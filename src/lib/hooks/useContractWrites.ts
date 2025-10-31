import { useState } from "react";
import { Address } from "viem";
import { writeContract } from "@wagmi/core";
import { config } from "~/components/providers/WagmiProvider";
import { submitAction } from "~/utils/submitAction";
import { ALPHA_CONTRACT_ADDRESS, ALPHA_CONTRACT_ABI } from "../otherConstants";
import { parseTokenAmount } from "../contract";

export const useCreateAlpha = () => {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAlpha = async (
    asset: string,
    ticker: string,
    targetPrice: string,
    expiry: number,
    stakeAmount: string,
    tokenURI: string
  ) => {
    setIsPending(false);
    setIsConfirming(false);
    setIsSuccess(false);
    setError(null);

    const parsedTargetPrice = parseTokenAmount(targetPrice, 18);
    const parsedStakeAmount = parseTokenAmount(stakeAmount, 6);

    await submitAction(
      async () => {
        return await writeContract(config, {
          address: ALPHA_CONTRACT_ADDRESS as Address,
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
          gas: BigInt(500000),
        });
      },
      {
        onPrompt: () => {
          setIsPending(true);
        },
        onSubmitted: () => {
          setIsPending(false);
          setIsConfirming(true);
        },
        onSuccess: () => {
          setIsConfirming(false);
          setIsSuccess(true);
        },
        onError: (err: unknown) => {
          setIsPending(false);
          setIsConfirming(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      }
    );
  };

  return {
    createAlpha,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
};

export const useBetAgainst = () => {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const betAgainst = async (alphaId: number, bettorFid: number) => {
    setIsPending(false);
    setIsConfirming(false);
    setIsSuccess(false);
    setError(null);

    await submitAction(
      async () => {
        return await writeContract(config, {
          address: ALPHA_CONTRACT_ADDRESS as Address,
          abi: ALPHA_CONTRACT_ABI,
          functionName: "betAgainstERC20",
          args: [BigInt(alphaId), BigInt(bettorFid)],
          gas: BigInt(300000),
        });
      },
      {
        onPrompt: () => {
          setIsPending(true);
        },
        onSubmitted: () => {
          setIsPending(false);
          setIsConfirming(true);
        },
        onSuccess: () => {
          setIsConfirming(false);
          setIsSuccess(true);
        },
        onError: (err: unknown) => {
          setIsPending(false);
          setIsConfirming(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      }
    );
  };

  return {
    betAgainst,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
};

export const useRequestAlphaSettlement = () => {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const requestAlphaSettlement = async (alphaId: number) => {
    setIsPending(false);
    setIsConfirming(false);
    setIsSuccess(false);
    setError(null);

    await submitAction(
      async () => {
        return await writeContract(config, {
          address: ALPHA_CONTRACT_ADDRESS as Address,
          abi: ALPHA_CONTRACT_ABI,
          functionName: "requestAlphaSettlement",
          args: [BigInt(alphaId)],
          gas: BigInt(500000),
        });
      },
      {
        onPrompt: () => {
          setIsPending(true);
        },
        onSubmitted: () => {
          setIsPending(false);
          setIsConfirming(true);
        },
        onSuccess: () => {
          setIsConfirming(false);
          setIsSuccess(true);
        },
        onError: (err: unknown) => {
          setIsPending(false);
          setIsConfirming(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      }
    );
  };

  return {
    requestAlphaSettlement,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
};

export const useFinalizeAlphaSettlement = () => {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const finalizeAlphaSettlement = async (alphaId: number) => {
    setIsPending(false);
    setIsConfirming(false);
    setIsSuccess(false);
    setError(null);

    await submitAction(
      async () => {
        return await writeContract(config, {
          address: ALPHA_CONTRACT_ADDRESS as Address,
          abi: ALPHA_CONTRACT_ABI,
          functionName: "finalizeAlphaSettlement",
          args: [BigInt(alphaId)],
          gas: BigInt(600000),
        });
      },
      {
        onPrompt: () => {
          setIsPending(true);
        },
        onSubmitted: () => {
          setIsPending(false);
          setIsConfirming(true);
        },
        onSuccess: () => {
          setIsConfirming(false);
          setIsSuccess(true);
        },
        onError: (err: unknown) => {
          setIsPending(false);
          setIsConfirming(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      }
    );
  };

  return {
    finalizeAlphaSettlement,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
};

export const useWithdraw = () => {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const withdraw = async () => {
    setIsPending(false);
    setIsConfirming(false);
    setIsSuccess(false);
    setError(null);

    await submitAction(
      async () => {
        return await writeContract(config, {
          address: ALPHA_CONTRACT_ADDRESS as Address,
          abi: ALPHA_CONTRACT_ABI,
          functionName: "withdrawToken",
          args: [],
          gas: BigInt(200000),
        });
      },
      {
        onPrompt: () => {
          setIsPending(true);
        },
        onSubmitted: () => {
          setIsPending(false);
          setIsConfirming(true);
        },
        onSuccess: () => {
          setIsConfirming(false);
          setIsSuccess(true);
        },
        onError: (err: unknown) => {
          setIsPending(false);
          setIsConfirming(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      }
    );
  };

  return {
    withdraw,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
};

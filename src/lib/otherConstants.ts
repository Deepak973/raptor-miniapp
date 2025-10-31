// Import ABI
import RaptorABI from "../lib/abi/AlphaMarketERC20_UMA.json";

// Contract addresses and configuration
export const ALPHA_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as string;
export const STAKE_TOKEN_ADDRESS = process.env
  .NEXT_PUBLIC_STAKE_TOKEN as string;
export const UMA_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_UMA_ORACLE as string;
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1");
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;

// Export ABI
export const ALPHA_CONTRACT_ABI = RaptorABI;

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Common token addresses for easy selection
export const COMMON_TOKENS = [
  {
    name: "Ethereum",
    symbol: "ETH",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
  },
  {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
  },
  {
    name: "Chainlink",
    symbol: "LINK",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18,
  },
  {
    name: "Uniswap",
    symbol: "UNI",
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18,
  },
] as const;

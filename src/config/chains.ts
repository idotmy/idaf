import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http, fallback } from "wagmi";
import { arbitrum } from "viem/chains";
import { SupportedChainConfig } from "../types/protocol.ts";


export const SUPPORTED_CHAINS: Record<number, SupportedChainConfig> = {
  42161: {
    id: 42161,
    name: "Arbitrum",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
};

const projectId = "abd26af6425e1f03291200a1ef2bfd26";

// Use RainbowKit's wallet definitions so each injected extension is discovered
// independently through EIP-6963 rather than sharing window.ethereum.
const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular Wallets",
      wallets: [
        metaMaskWallet,
        rabbyWallet,
        rainbowWallet,
        coinbaseWallet,

      ],
    },
    {
      groupName: "More wallets",
      wallets: [walletConnectWallet],
    },
  ],
  {
    appName: "Doti (.i)",
    projectId,
  },
);

export const config = createConfig({
  connectors,
  multiInjectedProviderDiscovery: true,
  chains: [arbitrum], // ONLY Arbitrum
  transports: {
    [arbitrum.id]: fallback([
      http("https://arb1.arbitrum.io/rpc"),
      http("https://arbitrum.llamarpc.com"),
      http("https://arbitrum-one-rpc.publicnode.com"),
      http("https://arbitrum.drpc.org"),
    ]),
  },
  ssr: false,
});

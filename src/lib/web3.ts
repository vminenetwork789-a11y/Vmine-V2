import { ethers } from 'ethers';

// Standard ERC20 / BEP20 Minimal ABI for USDT balance & transfer
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Popular Networks Config
export const SUPPORTED_NETWORKS = {
  // BSC Mainnet (Most common for USDT matrix apps)
  56: {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/'],
    usdtContract: '0x55d398326f99059fF775485246999027B3197955'
  },
  // BSC Testnet
  97: {
    chainId: '0x61',
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
    blockExplorerUrls: ['https://testnet.bscscan.com/'],
    usdtContract: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
  },
  // Polygon Mainnet
  137: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/'],
    usdtContract: '0xc2132D05D31cE1251A750 narrow7a740f959fE0e7c5'
  },
  // Ethereum Mainnet
  1: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://eth.llamarpc.com'],
    blockExplorerUrls: ['https://etherscan.io/'],
    usdtContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  }
};

export interface Web3WalletState {
  connected: boolean;
  address: string;
  nativeBalance: string;
  usdtBalance: string;
  chainId: number;
  chainName: string;
  provider: ethers.BrowserProvider | null;
  error?: string;
}

/**
 * Check if Web3 Ethereum Wallet (MetaMask, TrustWallet, TokenPocket, etc.) is installed in browser
 */
export function isWeb3Installed(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).ethereum);
}

/**
 * Get Web3 Provider from window.ethereum
 */
export function getWeb3Provider(): ethers.BrowserProvider | null {
  if (!isWeb3Installed()) return null;
  return new ethers.BrowserProvider((window as any).ethereum);
}

/**
 * Connect user's Web3 wallet
 */
export async function connectWeb3Wallet(): Promise<Web3WalletState> {
  if (!isWeb3Installed()) {
    throw new Error('NO_WALLET_INSTALLED');
  }

  try {
    const ethereum = (window as any).ethereum;
    const provider = new ethers.BrowserProvider(ethereum);

    // Request account access
    const accounts: string[] = await provider.send('eth_requestAccounts', []);
    if (!accounts || accounts.length === 0) {
      throw new Error('NO_ACCOUNTS_FOUND');
    }

    const address = accounts[0];
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Get Native Balance
    const balanceWei = await provider.getBalance(address);
    const nativeBalance = parseFloat(ethers.formatEther(balanceWei)).toFixed(4);

    // Get USDT balance if on supported chain
    let usdtBalance = '0.00';
    try {
      usdtBalance = await fetchUsdtBalance(provider, address, chainId);
    } catch (err) {
      console.warn('Could not fetch USDT balance:', err);
      // Fallback display
      usdtBalance = '0.00';
    }

    return {
      connected: true,
      address,
      nativeBalance,
      usdtBalance,
      chainId,
      chainName: getChainName(chainId),
      provider
    };
  } catch (error: any) {
    console.error('Error connecting Web3 wallet:', error);
    throw error;
  }
}

/**
 * Fetch USDT ERC-20 / BEP-20 Balance
 */
export async function fetchUsdtBalance(
  provider: ethers.BrowserProvider,
  userAddress: string,
  chainId: number
): Promise<string> {
  const netConfig = (SUPPORTED_NETWORKS as any)[chainId];
  if (!netConfig || !netConfig.usdtContract) {
    return '0.00';
  }

  try {
    const usdtContract = new ethers.Contract(netConfig.usdtContract, ERC20_ABI, provider);
    const rawBalance = await usdtContract.balanceOf(userAddress);
    const decimals = await usdtContract.decimals().catch(() => 18);
    const formatted = ethers.formatUnits(rawBalance, decimals);
    return parseFloat(formatted).toFixed(2);
  } catch (err) {
    console.warn('USDT Contract call failed:', err);
    return '0.00';
  }
}

/**
 * Helper to get readable chain name
 */
export function getChainName(chainId: number): string {
  const found = (SUPPORTED_NETWORKS as any)[chainId];
  if (found) return found.chainName;
  return `Chain ID: ${chainId}`;
}

/**
 * Switch or add network in wallet (e.g. BNB Smart Chain)
 */
export async function switchWeb3Network(targetChainIdHex: string): Promise<boolean> {
  if (!isWeb3Installed()) return false;
  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainIdHex }]
    });
    return true;
  } catch (switchError: any) {
    // Error code 4902 means the chain has not been added to wallet yet
    if (switchError.code === 4902) {
      const chainInt = parseInt(targetChainIdHex, 16);
      const netConfig = (SUPPORTED_NETWORKS as any)[chainInt];
      if (netConfig) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: netConfig.chainId,
              chainName: netConfig.chainName,
              nativeCurrency: netConfig.nativeCurrency,
              rpcUrls: netConfig.rpcUrls,
              blockExplorerUrls: netConfig.blockExplorerUrls
            }]
          });
          return true;
        } catch (addError) {
          console.error('Error adding chain:', addError);
          return false;
        }
      }
    }
    console.error('Error switching network:', switchError);
    return false;
  }
}

/**
 * Execute real USDT transaction or native transfer to Contract / Receiver
 */
export async function executeWeb3Purchase({
  amountUsdt,
  recipientAddress,
  usdtContractAddress
}: {
  amountUsdt: number;
  recipientAddress: string;
  usdtContractAddress?: string;
}): Promise<{ success: boolean; txHash: string }> {
  if (!isWeb3Installed()) {
    throw new Error('NO_WALLET_INSTALLED');
  }

  const ethereum = (window as any).ethereum;
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();

  // If contract address is provided, execute ERC20 transfer
  if (usdtContractAddress && ethers.isAddress(usdtContractAddress)) {
    const usdtContract = new ethers.Contract(usdtContractAddress, ERC20_ABI, signer);
    const decimals = await usdtContract.decimals().catch(() => 18);
    const amountUnits = ethers.parseUnits(amountUsdt.toString(), decimals);

    const tx = await usdtContract.transfer(recipientAddress, amountUnits);
    const receipt = await tx.wait();
    return {
      success: receipt.status === 1,
      txHash: tx.hash
    };
  } else {
    // If no contract specified, send direct native token transaction or generate signed transaction proof
    const tx = await signer.sendTransaction({
      to: recipientAddress,
      value: ethers.parseEther('0') // 0 ETH/BNB signal transaction or value
    });
    const receipt = await tx.wait();
    return {
      success: receipt ? receipt.status === 1 : true,
      txHash: tx.hash
    };
  }
}

/**
 * Listen for changes in accounts or chain
 */
export function setupWeb3Listeners(
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainIdHex: string) => void
) {
  if (!isWeb3Installed()) return () => {};

  const ethereum = (window as any).ethereum;

  const handleAccounts = (accounts: string[]) => onAccountsChanged(accounts);
  const handleChain = (chainId: string) => onChainChanged(chainId);

  ethereum.on('accountsChanged', handleAccounts);
  ethereum.on('chainChanged', handleChain);

  return () => {
    if (ethereum.removeListener) {
      ethereum.removeListener('accountsChanged', handleAccounts);
      ethereum.removeListener('chainChanged', handleChain);
    }
  };
}

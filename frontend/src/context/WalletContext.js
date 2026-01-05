import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

// Polygon network configuration
const POLYGON_MAINNET = {
  chainId: '0x89', // 137 in hex
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com']
};

const POLYGON_AMOY = {
  chainId: '0x13882', // 80002 in hex
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com']
};

// Use testnet for development
const TARGET_NETWORK = POLYGON_AMOY;

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const fetchBalance = useCallback(async (addr, prov) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, []);

  const switchToPolygon = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TARGET_NETWORK.chainId }]
      });
      return true;
    } catch (switchError) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [TARGET_NETWORK]
          });
          return true;
        } catch (addError) {
          console.error('Failed to add network:', addError);
          return false;
        }
      }
      console.error('Failed to switch network:', switchError);
      return false;
    }
  };

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return false;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();
      const network = await ethersProvider.getNetwork();

      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setAddress(accounts[0].toLowerCase());
      setChainId(Number(network.chainId));

      await fetchBalance(accounts[0], ethersProvider);

      // Suggest switching to Polygon if not on it
      const targetChainInt = parseInt(TARGET_NETWORK.chainId, 16);
      if (Number(network.chainId) !== targetChainInt) {
        await switchToPolygon();
      }

      return true;
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance(null);
    setError(null);
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0].toLowerCase());
        if (provider) {
          fetchBalance(accounts[0], provider);
        }
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(parseInt(newChainId, 16));
      // Refresh balance on chain change
      if (address && provider) {
        fetchBalance(address, provider);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, provider, fetchBalance, disconnect]);

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          connect();
        }
      } catch (err) {
        console.error('Auto-connect check failed:', err);
      }
    };

    checkConnection();
  }, [connect]);

  const value = {
    address,
    provider,
    signer,
    chainId,
    balance,
    isConnecting,
    isConnected: !!address,
    error,
    connect,
    disconnect,
    switchToPolygon,
    truncateAddress,
    targetNetwork: TARGET_NETWORK
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export default WalletContext;

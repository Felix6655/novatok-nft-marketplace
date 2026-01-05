import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { authUser, getNFTsByOwner, getUserTransactions } from '../lib/api';
import NFTCard from '../components/NFTCard';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Wallet, ExternalLink, Copy, Check, Grid3X3, History } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { address, isConnected, connect, balance, truncateAddress, chainId } = useWallet();
  const [user, setUser] = useState(null);
  const [nfts, setNFTs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        // Auth/register user
        const { user: userData } = await authUser(address);
        setUser(userData);

        // Fetch user's NFTs
        const userNFTs = await getNFTsByOwner(address);
        setNFTs(userNFTs);

        // Fetch transactions
        const txs = await getUserTransactions(address);
        setTransactions(txs);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [address]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-white/40" />
          </div>
          <h1 className="font-outfit font-bold text-3xl text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-white/60 mb-8">
            Connect your wallet to view your profile, NFTs, and transaction history.
          </p>
          <Button
            onClick={connect}
            className="bg-primary text-black font-bold hover:bg-primary-hover rounded-full px-8 py-6 h-auto text-lg shadow-[0_0_20px_rgba(204,255,0,0.4)]"
            data-testid="connect-wallet-profile"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header Banner */}
      <div className="h-48 bg-gradient-to-r from-primary/20 via-accent-purple/20 to-accent-cyan/20" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Profile Card */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-3xl bg-primary flex items-center justify-center border-4 border-background shadow-2xl">
              <span className="font-outfit font-bold text-4xl text-black">
                {address ? address.slice(2, 4).toUpperCase() : '??'}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-outfit font-bold text-3xl text-white mb-2" data-testid="profile-title">
                {user?.username || 'Unnamed'}
              </h1>
              
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                  data-testid="copy-address-btn"
                >
                  <span className="font-mono text-white/70">{truncateAddress(address)}</span>
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/50" />
                  )}
                </button>
                
                <a
                  href={`https://polygonscan.com/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-white/50" />
                </a>
              </div>

              {/* Balance */}
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-white/50 text-sm">Balance</p>
                  <p className="font-semibold text-white">
                    {balance ? `${parseFloat(balance).toFixed(4)} MATIC` : '0 MATIC'}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Network</p>
                  <p className="font-semibold text-white">
                    {chainId === 137 ? 'Polygon Mainnet' : chainId === 80002 ? 'Polygon Amoy' : `Chain ${chainId}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="owned" className="pb-16">
          <TabsList className="bg-white/5 border border-white/10 rounded-full p-1 mb-8">
            <TabsTrigger
              value="owned"
              className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-black"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Owned ({nfts.length})
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-black"
            >
              <History className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : nfts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Grid3X3 className="w-10 h-10 text-white/40" />
                </div>
                <h3 className="font-outfit font-semibold text-xl text-white mb-2">
                  No NFTs Yet
                </h3>
                <p className="text-white/60 mb-6">
                  Start your collection by exploring and purchasing NFTs
                </p>
                <Link to="/">
                  <Button className="bg-primary text-black font-bold hover:bg-primary-hover rounded-full px-8">
                    Explore NFTs
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="owned-nfts-grid">
                {nfts.map((nft) => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <History className="w-10 h-10 text-white/40" />
                </div>
                <h3 className="font-outfit font-semibold text-xl text-white mb-2">
                  No Activity Yet
                </h3>
                <p className="text-white/60">
                  Your transaction history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="activity-list">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.tx_type === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {tx.tx_type === 'buy' ? '+' : '-'}
                      </div>
                      <div>
                        <p className="font-semibold text-white capitalize">{tx.tx_type}</p>
                        <p className="text-white/50 text-sm">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{tx.amount} MATIC</p>
                      <a
                        href={`https://polygonscan.com/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm hover:underline flex items-center gap-1 justify-end"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;

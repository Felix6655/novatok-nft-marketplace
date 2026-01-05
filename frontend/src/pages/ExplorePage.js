import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCollections, getNFTs, getMarketplaceStats, seedData } from '../lib/api';
import NFTCard from '../components/NFTCard';
import CollectionCard from '../components/CollectionCard';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowRight, Zap, ShieldCheck, Wallet } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const ExplorePage = () => {
  const { isConnected, connect } = useWallet();
  const [collections, setCollections] = useState([]);
  const [nfts, setNFTs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First seed data if needed
        await seedData().catch(() => {});
        
        const [collectionsData, nftsData, statsData] = await Promise.all([
          getCollections(6),
          getNFTs({ limit: 8, is_listed: true }),
          getMarketplaceStats()
        ]);
        
        setCollections(collectionsData);
        setNFTs(nftsData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(204,255,0,0.12)_0%,rgba(5,5,5,0)_70%)]" />
        
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <h1 className="font-outfit font-bold text-5xl sm:text-6xl lg:text-7xl text-white mb-6 leading-tight">
              Discover, Collect, and Trade 
              <span className="text-gradient"> Unique NFTs</span>
            </h1>
            <p className="text-lg text-white/60 mb-10 max-w-xl">
              NovaToken is your gateway to the world of digital art and collectibles on Polygon. 
              Fast transactions, low fees, infinite possibilities.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/collections">
                <Button
                  className="bg-primary text-black font-bold hover:bg-primary-hover rounded-full px-8 py-6 h-auto text-lg shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] transition-all hover:scale-105"
                  data-testid="explore-btn"
                >
                  Explore Collections
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              {!isConnected && (
                <Button
                  onClick={connect}
                  variant="outline"
                  className="rounded-full px-8 py-6 h-auto text-lg border-white/20 hover:bg-white/10"
                  data-testid="hero-connect-btn"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-white/10">
              <div>
                <p className="text-3xl font-outfit font-bold text-white">{stats.total_collections}</p>
                <p className="text-white/50 mt-1">Collections</p>
              </div>
              <div>
                <p className="text-3xl font-outfit font-bold text-white">{stats.total_nfts}</p>
                <p className="text-white/50 mt-1">Total NFTs</p>
              </div>
              <div>
                <p className="text-3xl font-outfit font-bold text-white">{stats.active_listings}</p>
                <p className="text-white/50 mt-1">Active Listings</p>
              </div>
              <div>
                <p className="text-3xl font-outfit font-bold text-primary">{stats.total_volume.toFixed(1)}</p>
                <p className="text-white/50 mt-1">Volume (MATIC)</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Collections */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-outfit font-bold text-3xl text-white">Featured Collections</h2>
          <Link
            to="/collections"
            className="text-white/60 hover:text-primary transition-colors flex items-center gap-2"
            data-testid="view-all-collections"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[320px] rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.slice(0, 3).map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </section>

      {/* Trending NFTs */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-outfit font-bold text-3xl text-white">Trending NFTs</h2>
          <Link
            to="/collections"
            className="text-white/60 hover:text-primary transition-colors flex items-center gap-2"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nfts.slice(0, 8).map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-outfit font-bold text-xl text-white mb-3">Fast & Cheap</h3>
            <p className="text-white/60">
              Built on Polygon for lightning-fast transactions and minimal gas fees. 
              Trade NFTs without breaking the bank.
            </p>
          </div>
          
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-outfit font-bold text-xl text-white mb-3">Secure</h3>
            <p className="text-white/60">
              Your keys, your NFTs. We never have access to your wallet. 
              All transactions are verified on-chain.
            </p>
          </div>
          
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-outfit font-bold text-xl text-white mb-3">Easy to Use</h3>
            <p className="text-white/60">
              Connect your wallet and start trading in seconds. 
              No complicated setup required.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="font-outfit font-bold text-black text-lg">N</span>
              </div>
              <span className="font-outfit font-bold text-xl text-white">NovaToken</span>
            </div>
            <p className="text-white/40 text-sm">
              © 2025 NovaToken. Built on Polygon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExplorePage;

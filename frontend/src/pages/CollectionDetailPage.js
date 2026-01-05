import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCollection, getNFTs } from '../lib/api';
import NFTCard from '../components/NFTCard';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { ArrowLeft, ExternalLink, Users, Layers, TrendingUp } from 'lucide-react';

const CollectionDetailPage = () => {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collectionData, nftsData] = await Promise.all([
          getCollection(id),
          getNFTs({ collection_id: id, limit: 50 })
        ]);
        setCollection(collectionData);
        setNFTs(nftsData);
      } catch (error) {
        console.error('Failed to fetch collection:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <Skeleton className="h-[300px] w-full bg-white/5" />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 bg-white/5 mb-4" />
          <Skeleton className="h-6 w-96 bg-white/5" />
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Collection Not Found</h1>
          <Link to="/collections">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Collections
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Banner */}
      <div className="relative h-[300px] overflow-hidden">
        <img
          src={collection.banner_image}
          alt={collection.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Collection Header */}
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-background shadow-2xl">
              <img
                src={collection.logo_image}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Link to="/collections" className="text-white/50 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="font-outfit font-bold text-3xl sm:text-4xl text-white" data-testid="collection-title">
                  {collection.name}
                </h1>
              </div>
              
              {collection.description && (
                <p className="text-white/60 max-w-2xl mb-4">
                  {collection.description}
                </p>
              )}

              {/* Contract Address */}
              <a
                href={`https://polygonscan.com/address/${collection.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white/40 hover:text-primary transition-colors text-sm font-mono"
              >
                {collection.contract_address.slice(0, 10)}...{collection.contract_address.slice(-8)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <Layers className="w-4 h-4" />
              <span className="text-sm">Items</span>
            </div>
            <p className="font-outfit font-bold text-2xl text-white">{collection.item_count}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Owners</span>
            </div>
            <p className="font-outfit font-bold text-2xl text-white">{collection.owner_count}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Floor Price</span>
            </div>
            <p className="font-outfit font-bold text-2xl text-primary">
              {collection.floor_price} <span className="text-white/60 text-lg">MATIC</span>
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Volume</span>
            </div>
            <p className="font-outfit font-bold text-2xl text-white">
              {collection.total_volume.toFixed(1)} <span className="text-white/60 text-lg">MATIC</span>
            </p>
          </div>
        </div>

        {/* NFTs Grid */}
        <div className="pb-16">
          <h2 className="font-outfit font-bold text-2xl text-white mb-6">
            Items ({nfts.length})
          </h2>
          
          {nfts.length === 0 ? (
            <div className="text-center py-16 text-white/60">
              No items in this collection yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="nfts-grid">
              {nfts.map((nft) => (
                <NFTCard key={nft.id} nft={nft} showCollection={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailPage;

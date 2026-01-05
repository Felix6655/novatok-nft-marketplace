import { useEffect, useState } from 'react';
import { getCollections, seedData } from '../lib/api';
import CollectionCard from '../components/CollectionCard';
import { Skeleton } from '../components/ui/skeleton';

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        await seedData().catch(() => {});
        const data = await getCollections(20);
        setCollections(data);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-outfit font-bold text-4xl sm:text-5xl text-white mb-4">
            Explore Collections
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Discover unique NFT collections from talented creators around the world
          </p>
        </div>

        {/* Collections Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[320px] rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg">No collections found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="collections-grid">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionsPage;

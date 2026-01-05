import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const NFTCard = ({ nft, showCollection = true }) => {
  return (
    <Link
      to={`/nft/${nft.id}`}
      className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      data-testid={`nft-card-${nft.id}`}
    >
      {/* Image Container */}
      <div className="aspect-square overflow-hidden">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Like button */}
      <button
        className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 hover:scale-110"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        data-testid={`like-btn-${nft.id}`}
      >
        <Heart className="w-4 h-4 text-white" />
      </button>

      {/* Content */}
      <div className="p-4">
        {showCollection && nft.collection_name && (
          <p className="text-xs text-white/50 mb-1 truncate">{nft.collection_name}</p>
        )}
        <h3 className="font-outfit font-semibold text-white truncate mb-2">
          {nft.name}
        </h3>
        
        <div className="flex items-center justify-between">
          {nft.is_listed && nft.price ? (
            <div>
              <p className="text-xs text-white/50">Price</p>
              <p className="font-semibold text-primary">
                {nft.price} <span className="text-white/60 text-sm">MATIC</span>
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-white/50">Status</p>
              <p className="text-white/60 text-sm">Not Listed</p>
            </div>
          )}
          
          {nft.is_listed && (
            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Buy Now
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default NFTCard;

import { Link } from 'react-router-dom';
import { Users, Layers } from 'lucide-react';

const CollectionCard = ({ collection }) => {
  return (
    <Link
      to={`/collection/${collection.id}`}
      className="group relative h-[320px] rounded-3xl overflow-hidden cursor-pointer"
      data-testid={`collection-card-${collection.id}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={collection.banner_image || collection.logo_image}
          alt={collection.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        {/* Logo */}
        <div className="absolute top-4 left-4 w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
          <img
            src={collection.logo_image}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Collection Info */}
        <div className="space-y-3">
          <h3 className="font-outfit font-bold text-2xl text-white group-hover:text-primary transition-colors">
            {collection.name}
          </h3>
          
          {collection.description && (
            <p className="text-white/60 text-sm line-clamp-2">
              {collection.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white/50" />
              <span className="text-white/70 text-sm">
                <span className="text-white font-semibold">{collection.item_count}</span> items
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/50" />
              <span className="text-white/70 text-sm">
                <span className="text-white font-semibold">{collection.owner_count}</span> owners
              </span>
            </div>
          </div>

          {/* Floor Price */}
          {collection.floor_price && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-white/50 text-sm">Floor</span>
              <span className="text-primary font-semibold">
                {collection.floor_price} MATIC
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CollectionCard;

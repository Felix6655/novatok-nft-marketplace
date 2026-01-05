import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNFT, getCollection, buyListing, getActiveListings } from '../lib/api';
import { useWallet } from '../context/WalletContext';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ArrowLeft, ExternalLink, Heart, Share2, Wallet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';

const NFTDetailPage = () => {
  const { id } = useParams();
  const { address, isConnected, connect, signer, truncateAddress } = useWallet();
  const [nft, setNFT] = useState(null);
  const [collection, setCollection] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyStep, setBuyStep] = useState('confirm'); // confirm, processing, success, error
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const nftData = await getNFT(id);
        setNFT(nftData);

        // Fetch collection if available
        if (nftData.collection_id) {
          const collectionData = await getCollection(nftData.collection_id);
          setCollection(collectionData);
        }

        // Find listing if NFT is listed
        if (nftData.is_listed) {
          const listings = await getActiveListings();
          const nftListing = listings.find(l => l.nft_id === id);
          setListing(nftListing);
        }
      } catch (error) {
        console.error('Failed to fetch NFT:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleBuy = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (!listing || !signer) return;

    setBuyDialogOpen(true);
    setBuyStep('confirm');
  };

  const confirmBuy = async () => {
    setBuyStep('processing');

    try {
      // Create transaction to send MATIC to seller
      const tx = await signer.sendTransaction({
        to: listing.seller_address,
        value: ethers.parseEther(listing.price.toString())
      });

      setTxHash(tx.hash);

      // Wait for transaction confirmation
      await tx.wait();

      // Record the purchase in backend
      await buyListing(listing.id, address, tx.hash);

      setBuyStep('success');
      toast.success('NFT purchased successfully!');

      // Refresh NFT data
      const updatedNFT = await getNFT(id);
      setNFT(updatedNFT);
      setListing(null);

    } catch (error) {
      console.error('Purchase failed:', error);
      setBuyStep('error');
      toast.error(error.message || 'Purchase failed');
    }
  };

  const isOwner = address && nft && nft.owner_address.toLowerCase() === address.toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-3xl bg-white/5" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-64 bg-white/5" />
              <Skeleton className="h-6 w-48 bg-white/5" />
              <Skeleton className="h-32 w-full bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">NFT Not Found</h1>
          <Link to="/">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          to={collection ? `/collection/${collection.id}` : '/'}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {collection ? `Back to ${collection.name}` : 'Back to Explore'}
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden border border-white/10">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors">
                <Heart className="w-5 h-5 text-white" />
              </button>
              <button className="p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Collection Link */}
            {collection && (
              <Link
                to={`/collection/${collection.id}`}
                className="inline-flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
              >
                <img
                  src={collection.logo_image}
                  alt={collection.name}
                  className="w-6 h-6 rounded-lg"
                />
                {collection.name}
              </Link>
            )}

            <h1 className="font-outfit font-bold text-4xl text-white" data-testid="nft-title">
              {nft.name}
            </h1>

            {/* Owner */}
            <div className="flex items-center gap-3">
              <span className="text-white/50">Owned by</span>
              <span className="font-mono text-white">
                {isOwner ? 'You' : truncateAddress(nft.owner_address)}
              </span>
              {isOwner && (
                <Badge variant="outline" className="border-primary text-primary">
                  Owner
                </Badge>
              )}
            </div>

            {/* Description */}
            {nft.description && (
              <p className="text-white/60">{nft.description}</p>
            )}

            {/* Price Card */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              {nft.is_listed && nft.price ? (
                <>
                  <p className="text-white/50 mb-2">Current Price</p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="font-outfit font-bold text-4xl text-primary">
                      {nft.price}
                    </span>
                    <span className="text-white/60 text-xl">MATIC</span>
                  </div>

                  {!isOwner && (
                    <Button
                      onClick={handleBuy}
                      className="w-full bg-primary text-black font-bold hover:bg-primary-hover rounded-full py-6 h-auto text-lg shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] transition-all hover:scale-[1.02]"
                      data-testid="buy-now-btn"
                    >
                      {isConnected ? (
                        <>Buy Now</>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5 mr-2" />
                          Connect Wallet to Buy
                        </>
                      )}
                    </Button>
                  )}

                  {isOwner && (
                    <p className="text-center text-white/50">
                      This is your NFT
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/50 mb-2">Status</p>
                  <p className="text-white text-lg">Not Listed for Sale</p>
                </div>
              )}
            </div>

            {/* Attributes */}
            {nft.attributes && nft.attributes.length > 0 && (
              <div>
                <h3 className="font-outfit font-semibold text-lg text-white mb-4">Attributes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {nft.attributes.map((attr, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <p className="text-primary text-xs uppercase tracking-wider mb-1">
                        {attr.trait_type}
                      </p>
                      <p className="text-white font-medium">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contract Info */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="font-outfit font-semibold text-lg text-white mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Contract Address</span>
                  <a
                    href={`https://polygonscan.com/address/${nft.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-white hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {truncateAddress(nft.contract_address)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Token ID</span>
                  <span className="font-mono text-white">{nft.token_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Blockchain</span>
                  <span className="text-white">Polygon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10">
          <DialogHeader>
            <DialogTitle className="font-outfit text-white">
              {buyStep === 'confirm' && 'Confirm Purchase'}
              {buyStep === 'processing' && 'Processing...'}
              {buyStep === 'success' && 'Purchase Complete!'}
              {buyStep === 'error' && 'Purchase Failed'}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {buyStep === 'confirm' && `You are about to purchase ${nft.name}`}
              {buyStep === 'processing' && 'Please confirm the transaction in your wallet'}
              {buyStep === 'success' && 'You now own this NFT!'}
              {buyStep === 'error' && 'Something went wrong with your purchase'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {buyStep === 'confirm' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white">{nft.name}</p>
                    <p className="text-white/50 text-sm">{collection?.name}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 flex justify-between items-center">
                  <span className="text-white/60">Total</span>
                  <span className="font-outfit font-bold text-2xl text-primary">
                    {nft.price} MATIC
                  </span>
                </div>
                <Button
                  onClick={confirmBuy}
                  className="w-full bg-primary text-black font-bold hover:bg-primary-hover rounded-full py-4"
                  data-testid="confirm-buy-btn"
                >
                  Confirm Purchase
                </Button>
              </div>
            )}

            {buyStep === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-white">Waiting for confirmation...</p>
                {txHash && (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    View on PolygonScan
                  </a>
                )}
              </div>
            )}

            {buyStep === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <p className="text-white text-lg mb-2">Congratulations!</p>
                <p className="text-white/60 mb-6">You now own {nft.name}</p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => setBuyDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Link to="/profile" className="flex-1">
                    <Button className="w-full bg-primary text-black rounded-full">
                      View in Profile
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {buyStep === 'error' && (
              <div className="text-center py-8">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-white mb-4">Transaction failed</p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setBuyStep('confirm')}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NFTDetailPage;

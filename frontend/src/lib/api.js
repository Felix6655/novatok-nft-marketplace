import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json'
  }
});

// User API
export const authUser = async (walletAddress) => {
  const response = await api.post('/users/auth', { wallet_address: walletAddress });
  return response.data;
};

export const getUser = async (walletAddress) => {
  const response = await api.get(`/users/${walletAddress}`);
  return response.data;
};

export const updateUser = async (walletAddress, data) => {
  const response = await api.put(`/users/${walletAddress}`, data);
  return response.data;
};

// Collections API
export const getCollections = async (limit = 20, skip = 0) => {
  const response = await api.get('/collections', { params: { limit, skip } });
  return response.data;
};

export const getCollection = async (collectionId) => {
  const response = await api.get(`/collections/${collectionId}`);
  return response.data;
};

// NFTs API
export const getNFTs = async (params = {}) => {
  const response = await api.get('/nfts', { params });
  return response.data;
};

export const getNFT = async (nftId) => {
  const response = await api.get(`/nfts/${nftId}`);
  return response.data;
};

export const getNFTsByOwner = async (walletAddress) => {
  const response = await api.get(`/nfts/owner/${walletAddress}`);
  return response.data;
};

// Listings API
export const createListing = async (nftId, sellerAddress, price) => {
  const response = await api.post('/listings', {
    nft_id: nftId,
    seller_address: sellerAddress,
    price
  });
  return response.data;
};

export const getActiveListings = async (limit = 50) => {
  const response = await api.get('/listings', { params: { limit } });
  return response.data;
};

export const buyListing = async (listingId, buyerAddress, txHash) => {
  const response = await api.post(`/listings/${listingId}/buy`, {
    buyer_address: buyerAddress,
    tx_hash: txHash
  });
  return response.data;
};

export const cancelListing = async (listingId, sellerAddress) => {
  const response = await api.delete(`/listings/${listingId}`, {
    data: { seller_address: sellerAddress }
  });
  return response.data;
};

// Transactions API
export const getUserTransactions = async (walletAddress) => {
  const response = await api.get(`/transactions/${walletAddress}`);
  return response.data;
};

// Stats API
export const getMarketplaceStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

// Seed data (development only)
export const seedData = async () => {
  const response = await api.post('/seed');
  return response.data;
};

export default api;

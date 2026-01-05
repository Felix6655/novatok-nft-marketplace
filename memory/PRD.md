# NovaToken NFT Marketplace - Product Requirements Document

## Original Problem Statement
Build NovaToken NFT Marketplace - a Web3 NFT marketplace with:
- Browse & discover NFTs
- User profiles & collections  
- Basic Buy Now/List functionality
- Wallet connection (MetaMask/WalletConnect)
- Polygon blockchain support
- No auctions, no minting, no AI features
- Wallet-first authentication only (no email/password)
- Crypto-only payments via MATIC

## User Personas
1. **NFT Collectors** - Users who browse, discover, and purchase NFTs
2. **NFT Sellers** - Users who list their NFTs for sale
3. **Casual Browsers** - Users exploring the NFT space without immediate purchase intent

## Core Requirements (Static)
- Wallet-based authentication (MetaMask/WalletConnect)
- Polygon network support (Amoy testnet for dev, mainnet for prod)
- Browse NFT collections and individual NFTs
- View NFT details with attributes, price, owner
- Buy Now functionality with MATIC payments
- User profile/portfolio showing owned NFTs
- Transaction history tracking

## Architecture
- **Frontend**: React with TailwindCSS, ethers.js v6 for Web3
- **Backend**: FastAPI with MongoDB via Motor
- **Database**: MongoDB (collections: users, collections, nfts, listings, transactions)
- **Blockchain**: Polygon (EVM-compatible)

## What's Been Implemented (MVP - January 5, 2025)
### Backend
- User auth/registration via wallet address
- Collections CRUD (GET all, GET by ID, POST create)
- NFTs CRUD (GET all with filters, GET by ID, GET by owner, POST create)
- Listings management (POST create, GET active, POST buy, DELETE cancel)
- Transactions tracking (GET by wallet)
- Marketplace stats endpoint
- Seed data endpoint for development

### Frontend
- **Header**: Logo, navigation, search, wallet connect button
- **Explore Page**: Hero section, stats, featured collections, trending NFTs
- **Collections Page**: Grid of all collections
- **Collection Detail Page**: Collection info, stats, NFTs grid
- **NFT Detail Page**: Full NFT info, attributes, buy button, purchase dialog
- **Profile Page**: Wallet info, owned NFTs, transaction history

### Design
- "Electric Void" theme - #050505 background, #CCFF00 acid lime accent
- Outfit + Manrope typography
- Glassmorphism effects, glow shadows
- Dark mode only, Web3-native aesthetic

## Prioritized Backlog

### P0 (Critical - Next Phase)
- [ ] Real smart contract integration for NFT transfers
- [ ] Listing price validation and escrow

### P1 (High Priority)
- [ ] Search functionality across collections and NFTs
- [ ] Filter/sort NFTs by price, date, rarity
- [ ] User profile editing (username, avatar, bio)
- [ ] Activity feed/notifications

### P2 (Medium Priority)
- [ ] Collection verification badges
- [ ] NFT favorites/watchlist
- [ ] Social sharing features
- [ ] Price history charts

### P3 (Nice to Have)
- [ ] Dark/light theme toggle
- [ ] Multi-chain support (Ethereum, Base)
- [ ] Batch listing/purchasing
- [ ] Rarity rankings

## Next Tasks
1. Implement search functionality
2. Add smart contract integration for actual NFT transfers
3. Deploy to production with Polygon mainnet
4. Add collection/NFT filtering and sorting

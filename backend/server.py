from fastapi import FastAPI, APIRouter, HTTPException, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="NovaToken NFT Marketplace API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== Models ==============

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_address: str
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    wallet_address: str
    username: Optional[str] = None

class NFTItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    token_id: str
    contract_address: str
    name: str
    description: Optional[str] = None
    image: str
    owner_address: str
    collection_id: Optional[str] = None
    attributes: Optional[List[dict]] = []
    price: Optional[float] = None  # In MATIC
    is_listed: bool = False
    listed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NFTCollection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    contract_address: str
    banner_image: Optional[str] = None
    logo_image: Optional[str] = None
    creator_address: str
    floor_price: Optional[float] = None
    total_volume: float = 0
    item_count: int = 0
    owner_count: int = 0
    chain_id: int = 137  # Polygon mainnet
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Listing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nft_id: str
    seller_address: str
    price: float  # In MATIC
    status: str = "active"  # active, sold, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sold_at: Optional[datetime] = None
    buyer_address: Optional[str] = None

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tx_hash: str
    from_address: str
    to_address: str
    nft_id: str
    collection_id: Optional[str] = None
    amount: float  # In MATIC
    tx_type: str  # buy, sell, transfer
    status: str = "pending"  # pending, confirmed, failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== User Routes ==============

@api_router.post("/users/auth", response_model=dict)
async def auth_user(wallet_address: str = Body(..., embed=True)):
    """Authenticate/register user by wallet address"""
    wallet_address = wallet_address.lower()
    
    existing = await db.users.find_one({"wallet_address": wallet_address}, {"_id": 0})
    if existing:
        return {"user": existing, "is_new": False}
    
    user = User(wallet_address=wallet_address)
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    result = await db.users.find_one({"id": user.id}, {"_id": 0})
    return {"user": result, "is_new": True}

@api_router.get("/users/{wallet_address}")
async def get_user(wallet_address: str):
    """Get user profile by wallet address"""
    user = await db.users.find_one({"wallet_address": wallet_address.lower()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/{wallet_address}")
async def update_user(wallet_address: str, username: Optional[str] = Body(None), bio: Optional[str] = Body(None), avatar: Optional[str] = Body(None)):
    """Update user profile"""
    update_data = {}
    if username is not None:
        update_data["username"] = username
    if bio is not None:
        update_data["bio"] = bio
    if avatar is not None:
        update_data["avatar"] = avatar
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.users.update_one(
        {"wallet_address": wallet_address.lower()},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated = await db.users.find_one({"wallet_address": wallet_address.lower()}, {"_id": 0})
    return updated

# ============== Collection Routes ==============

@api_router.get("/collections", response_model=List[dict])
async def get_collections(limit: int = 20, skip: int = 0):
    """Get all NFT collections"""
    collections = await db.collections.find({}, {"_id": 0}).sort("total_volume", -1).skip(skip).limit(limit).to_list(limit)
    return collections

@api_router.get("/collections/{collection_id}")
async def get_collection(collection_id: str):
    """Get collection by ID"""
    collection = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection

@api_router.post("/collections")
async def create_collection(collection: NFTCollection):
    """Create a new collection"""
    doc = collection.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.collections.insert_one(doc)
    result = await db.collections.find_one({"id": collection.id}, {"_id": 0})
    return result

# ============== NFT Routes ==============

@api_router.get("/nfts", response_model=List[dict])
async def get_nfts(limit: int = 20, skip: int = 0, collection_id: Optional[str] = None, is_listed: Optional[bool] = None):
    """Get NFTs with optional filters"""
    query = {}
    if collection_id:
        query["collection_id"] = collection_id
    if is_listed is not None:
        query["is_listed"] = is_listed
    
    nfts = await db.nfts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return nfts

@api_router.get("/nfts/{nft_id}")
async def get_nft(nft_id: str):
    """Get NFT by ID"""
    nft = await db.nfts.find_one({"id": nft_id}, {"_id": 0})
    if not nft:
        raise HTTPException(status_code=404, detail="NFT not found")
    return nft

@api_router.get("/nfts/owner/{wallet_address}")
async def get_nfts_by_owner(wallet_address: str, limit: int = 50):
    """Get NFTs owned by a wallet"""
    nfts = await db.nfts.find({"owner_address": wallet_address.lower()}, {"_id": 0}).limit(limit).to_list(limit)
    return nfts

@api_router.post("/nfts")
async def create_nft(nft: NFTItem):
    """Create/register a new NFT"""
    doc = nft.model_dump()
    doc['owner_address'] = doc['owner_address'].lower()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('listed_at'):
        doc['listed_at'] = doc['listed_at'].isoformat()
    await db.nfts.insert_one(doc)
    result = await db.nfts.find_one({"id": nft.id}, {"_id": 0})
    return result

# ============== Listing Routes ==============

@api_router.post("/listings")
async def create_listing(nft_id: str = Body(...), seller_address: str = Body(...), price: float = Body(...)):
    """List an NFT for sale"""
    nft = await db.nfts.find_one({"id": nft_id}, {"_id": 0})
    if not nft:
        raise HTTPException(status_code=404, detail="NFT not found")
    
    if nft["owner_address"].lower() != seller_address.lower():
        raise HTTPException(status_code=403, detail="You don't own this NFT")
    
    listing = Listing(nft_id=nft_id, seller_address=seller_address.lower(), price=price)
    doc = listing.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.listings.insert_one(doc)
    
    # Update NFT listing status
    await db.nfts.update_one(
        {"id": nft_id},
        {"$set": {"is_listed": True, "price": price, "listed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    result = await db.listings.find_one({"id": listing.id}, {"_id": 0})
    return result

@api_router.get("/listings")
async def get_active_listings(limit: int = 50):
    """Get active listings"""
    listings = await db.listings.find({"status": "active"}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return listings

@api_router.post("/listings/{listing_id}/buy")
async def buy_listing(listing_id: str, buyer_address: str = Body(...), tx_hash: str = Body(...)):
    """Buy a listed NFT"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["status"] != "active":
        raise HTTPException(status_code=400, detail="Listing is not active")
    
    # Update listing
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {
            "status": "sold",
            "sold_at": datetime.now(timezone.utc).isoformat(),
            "buyer_address": buyer_address.lower()
        }}
    )
    
    # Update NFT ownership
    await db.nfts.update_one(
        {"id": listing["nft_id"]},
        {"$set": {
            "owner_address": buyer_address.lower(),
            "is_listed": False,
            "price": None,
            "listed_at": None
        }}
    )
    
    # Record transaction
    tx = Transaction(
        tx_hash=tx_hash,
        from_address=listing["seller_address"],
        to_address=buyer_address.lower(),
        nft_id=listing["nft_id"],
        amount=listing["price"],
        tx_type="buy",
        status="confirmed"
    )
    tx_doc = tx.model_dump()
    tx_doc['created_at'] = tx_doc['created_at'].isoformat()
    await db.transactions.insert_one(tx_doc)
    
    return {"success": True, "transaction_id": tx.id}

@api_router.delete("/listings/{listing_id}")
async def cancel_listing(listing_id: str, seller_address: str = Body(..., embed=True)):
    """Cancel a listing"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["seller_address"].lower() != seller_address.lower():
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": "cancelled"}})
    await db.nfts.update_one(
        {"id": listing["nft_id"]},
        {"$set": {"is_listed": False, "price": None, "listed_at": None}}
    )
    
    return {"success": True}

# ============== Transaction Routes ==============

@api_router.get("/transactions/{wallet_address}")
async def get_user_transactions(wallet_address: str, limit: int = 50):
    """Get transactions for a wallet"""
    wallet = wallet_address.lower()
    txs = await db.transactions.find(
        {"$or": [{"from_address": wallet}, {"to_address": wallet}]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return txs

# ============== Stats Routes ==============

@api_router.get("/stats")
async def get_marketplace_stats():
    """Get marketplace statistics"""
    total_collections = await db.collections.count_documents({})
    total_nfts = await db.nfts.count_documents({})
    total_listings = await db.listings.count_documents({"status": "active"})
    total_sales = await db.transactions.count_documents({"tx_type": "buy", "status": "confirmed"})
    
    # Calculate total volume
    pipeline = [
        {"$match": {"tx_type": "buy", "status": "confirmed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    volume_result = await db.transactions.aggregate(pipeline).to_list(1)
    total_volume = volume_result[0]["total"] if volume_result else 0
    
    return {
        "total_collections": total_collections,
        "total_nfts": total_nfts,
        "active_listings": total_listings,
        "total_sales": total_sales,
        "total_volume": total_volume
    }

# ============== Seed Data Route (for development) ==============

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for development"""
    # Check if already seeded
    existing = await db.collections.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "collections": existing}
    
    # Sample collections
    collections_data = [
        {
            "id": "col-1",
            "name": "Cosmic Dreamers",
            "description": "A collection of surreal cosmic artworks exploring the depths of imagination",
            "contract_address": "0x1234567890abcdef1234567890abcdef12345678",
            "banner_image": "https://images.unsplash.com/photo-1762341154386-fa765c9f2aa5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
            "logo_image": "https://images.unsplash.com/photo-1731335069412-b2a783ae6dac?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
            "creator_address": "0xdemo0000000000000000000000000000000001",
            "floor_price": 0.5,
            "total_volume": 125.5,
            "item_count": 10,
            "owner_count": 8,
            "chain_id": 137,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "col-2",
            "name": "Digital Abstracts",
            "description": "Abstract digital art pushing the boundaries of color and form",
            "contract_address": "0xabcdef1234567890abcdef1234567890abcdef12",
            "banner_image": "https://images.unsplash.com/photo-1736176421397-0fbac2e0b36a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
            "logo_image": "https://images.unsplash.com/photo-1737812714165-565790a9f354?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
            "creator_address": "0xdemo0000000000000000000000000000000002",
            "floor_price": 0.8,
            "total_volume": 89.2,
            "item_count": 8,
            "owner_count": 6,
            "chain_id": 137,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "col-3",
            "name": "Neon Futures",
            "description": "Cyberpunk-inspired neon artworks from the future",
            "contract_address": "0x567890abcdef1234567890abcdef123456789012",
            "banner_image": "https://images.pexels.com/photos/14321795/pexels-photo-14321795.jpeg?w=1200",
            "logo_image": "https://images.unsplash.com/photo-1750096319146-6310519b5af2?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
            "creator_address": "0xdemo0000000000000000000000000000000003",
            "floor_price": 1.2,
            "total_volume": 210.8,
            "item_count": 12,
            "owner_count": 10,
            "chain_id": 137,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Sample NFTs
    nfts_data = [
        # Cosmic Dreamers collection
        {"id": "nft-1", "token_id": "1", "contract_address": "0x1234567890abcdef1234567890abcdef12345678", "name": "Stellar Voyage", "description": "A journey through the cosmic void", "image": "https://images.unsplash.com/photo-1731335069412-b2a783ae6dac?crop=entropy&cs=srgb&fm=jpg&q=85", "owner_address": "0xdemo0000000000000000000000000000000001", "collection_id": "col-1", "price": 0.8, "is_listed": True, "attributes": [{"trait_type": "Background", "value": "Cosmic"}, {"trait_type": "Rarity", "value": "Rare"}], "listed_at": datetime.now(timezone.utc).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "nft-2", "token_id": "2", "contract_address": "0x1234567890abcdef1234567890abcdef12345678", "name": "Nebula Dreams", "description": "Dreams painted in stardust", "image": "https://images.unsplash.com/photo-1736176421397-0fbac2e0b36a?crop=entropy&cs=srgb&fm=jpg&q=85", "owner_address": "0xdemo0000000000000000000000000000000002", "collection_id": "col-1", "price": 1.2, "is_listed": True, "attributes": [{"trait_type": "Background", "value": "Nebula"}, {"trait_type": "Rarity", "value": "Epic"}], "listed_at": datetime.now(timezone.utc).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "nft-3", "token_id": "3", "contract_address": "0x1234567890abcdef1234567890abcdef12345678", "name": "Galaxy Portal", "description": "A gateway to infinite worlds", "image": "https://images.unsplash.com/photo-1737812714165-565790a9f354?crop=entropy&cs=srgb&fm=jpg&q=85", "owner_address": "0xdemo0000000000000000000000000000000003", "collection_id": "col-1", "price": 0.5, "is_listed": True, "attributes": [{"trait_type": "Background", "value": "Portal"}, {"trait_type": "Rarity", "value": "Common"}], "listed_at": datetime.now(timezone.utc).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Digital Abstracts collection
        {"id": "nft-4", "token_id": "1", "contract_address": "0xabcdef1234567890abcdef1234567890abcdef12", "name": "Color Explosion", "description": "Abstract burst of vibrant colors", "image": "https://images.unsplash.com/photo-1750096319146-6310519b5af2?crop=entropy&cs=srgb&fm=jpg&q=85", "owner_address": "0xdemo0000000000000000000000000000000001", "collection_id": "col-2", "price": 0.9, "is_listed": True, "attributes": [{"trait_type": "Style", "value": "Explosive"}, {"trait_type": "Rarity", "value": "Rare"}], "listed_at": datetime.now(timezone.utc).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "nft-5", "token_id": "2", "contract_address": "0xabcdef1234567890abcdef1234567890abcdef12", "name": "Fluid Motion", "description": "Flowing abstract patterns", "image": "https://images.unsplash.com/photo-1659141632957-a2cd74b8a446?crop=entropy&cs=srgb&fm=jpg&q=85", "owner_address": "0xdemo0000000000000000000000000000000002", "collection_id": "col-2", "price": 0.7, "is_listed": True, "attributes": [{"trait_type": "Style", "value": "Fluid"}, {"trait_type": "Rarity", "value": "Common"}], "listed_at": datetime.now(timezone.utc).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Neon Futures collection
        {"id": "nft-6", "token_id": "1", "contract_address": "0x567890abcdef1234567890abcdef123456789012", "name": "Cyber City", "description": "Neon-lit cityscape of tomorrow", "image": "https://images.unsplash.com/photo-1656229181541-a42184b5625c?crop=entropy&cs=srgb&fm=jpg&q=85", "owner_address": "0xdemo0000000000000000000000000000000003", "collection_id": "col-3", "price": 1.5, "is_listed": True, "attributes": [{"trait_type": "Theme", "value": "Cyberpunk"}, {"trait_type": "Rarity", "value": "Legendary"}], "listed_at": datetime.now(timezone.utc).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "nft-7", "token_id": "2", "contract_address": "0x567890abcdef1234567890abcdef123456789012", "name": "Digital Samurai", "description": "Warrior of the digital realm", "image": "https://images.pexels.com/photos/14321795/pexels-photo-14321795.jpeg", "owner_address": "0xdemo0000000000000000000000000000000001", "collection_id": "col-3", "price": 2.0, "is_listed": True, "attributes": [{"trait_type": "Theme", "value": "Warrior"}, {"trait_type": "Rarity", "value": "Legendary"}], "listed_at": datetime.now(timezone.utc).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "nft-8", "token_id": "3", "contract_address": "0x567890abcdef1234567890abcdef123456789012", "name": "Neon Runner", "description": "Speed through neon streets", "image": "https://images.unsplash.com/photo-1762341154386-fa765c9f2aa5?crop=entropy&cs=srgb&fm=jpg&q=85", "owner_address": "0xdemo0000000000000000000000000000000002", "collection_id": "col-3", "price": 1.3, "is_listed": True, "attributes": [{"trait_type": "Theme", "value": "Speed"}, {"trait_type": "Rarity", "value": "Epic"}], "listed_at": datetime.now(timezone.utc).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Insert collections
    await db.collections.insert_many(collections_data)
    
    # Insert NFTs
    await db.nfts.insert_many(nfts_data)
    
    # Create listings for listed NFTs
    listings_data = []
    for nft in nfts_data:
        if nft.get("is_listed"):
            listings_data.append({
                "id": f"listing-{nft['id']}",
                "nft_id": nft["id"],
                "seller_address": nft["owner_address"],
                "price": nft["price"],
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    await db.listings.insert_many(listings_data)
    
    return {"message": "Data seeded successfully", "collections": len(collections_data), "nfts": len(nfts_data)}

@api_router.get("/")
async def root():
    return {"message": "NovaToken NFT Marketplace API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class NovaTokenAPITester:
    def __init__(self, base_url="https://nft-bazaar-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if not endpoint.startswith('api/') else f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_seed_data(self):
        """Seed initial data"""
        return self.run_test("Seed Data", "POST", "seed", 200)

    def test_marketplace_stats(self):
        """Test marketplace stats"""
        return self.run_test("Marketplace Stats", "GET", "stats", 200)

    def test_get_collections(self):
        """Test get collections"""
        success, response = self.run_test("Get Collections", "GET", "collections", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} collections")
            if len(response) > 0:
                print(f"   First collection: {response[0].get('name', 'Unknown')}")
        return success, response

    def test_get_collection_detail(self, collection_id):
        """Test get collection by ID"""
        return self.run_test(f"Get Collection {collection_id}", "GET", f"collections/{collection_id}", 200)

    def test_get_nfts(self):
        """Test get NFTs"""
        success, response = self.run_test("Get NFTs", "GET", "nfts", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} NFTs")
            if len(response) > 0:
                print(f"   First NFT: {response[0].get('name', 'Unknown')}")
        return success, response

    def test_get_nft_detail(self, nft_id):
        """Test get NFT by ID"""
        return self.run_test(f"Get NFT {nft_id}", "GET", f"nfts/{nft_id}", 200)

    def test_get_listed_nfts(self):
        """Test get listed NFTs"""
        return self.run_test("Get Listed NFTs", "GET", "nfts?is_listed=true", 200)

    def test_get_active_listings(self):
        """Test get active listings"""
        return self.run_test("Get Active Listings", "GET", "listings", 200)

    def test_user_auth(self):
        """Test user authentication"""
        test_wallet = "0x1234567890abcdef1234567890abcdef12345678"
        return self.run_test("User Auth", "POST", "users/auth", 200, {"wallet_address": test_wallet})

    def test_get_user(self, wallet_address):
        """Test get user by wallet"""
        return self.run_test("Get User", "GET", f"users/{wallet_address}", 200)

    def test_get_nfts_by_owner(self, wallet_address):
        """Test get NFTs by owner"""
        return self.run_test("Get NFTs by Owner", "GET", f"nfts/owner/{wallet_address}", 200)

    def test_get_user_transactions(self, wallet_address):
        """Test get user transactions"""
        return self.run_test("Get User Transactions", "GET", f"transactions/{wallet_address}", 200)

def main():
    print("🚀 Starting NovaToken NFT Marketplace API Tests")
    print("=" * 60)
    
    tester = NovaTokenAPITester()
    
    # Test basic endpoints
    tester.test_root_endpoint()
    
    # Seed data first
    tester.test_seed_data()
    
    # Test marketplace stats
    tester.test_marketplace_stats()
    
    # Test collections
    success, collections = tester.test_get_collections()
    if success and collections:
        # Test first collection detail
        tester.test_get_collection_detail(collections[0]['id'])
    
    # Test NFTs
    success, nfts = tester.test_get_nfts()
    if success and nfts:
        # Test first NFT detail
        tester.test_get_nft_detail(nfts[0]['id'])
    
    # Test listed NFTs
    tester.test_get_listed_nfts()
    
    # Test listings
    tester.test_get_active_listings()
    
    # Test user functionality
    success, user_data = tester.test_user_auth()
    if success and user_data.get('user'):
        wallet_address = user_data['user']['wallet_address']
        tester.test_get_user(wallet_address)
        tester.test_get_nfts_by_owner(wallet_address)
        tester.test_get_user_transactions(wallet_address)
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for test in tester.failed_tests:
            print(f"   - {test['name']}: {test.get('error', f'Expected {test.get(\"expected\")}, got {test.get(\"actual\")}')}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
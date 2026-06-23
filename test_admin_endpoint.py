#!/usr/bin/env python3
"""
Quick test script for admin endpoints.
This is for local testing only - requires running backend server.
"""

import requests
import os

# Configuration
BASE_URL = "http://localhost:8000/api"
TOKEN = os.getenv("DROPBOX_ACCESS_TOKEN", "test_token_here")

headers = {"Authorization": f"Bearer {TOKEN}"}

def test_recordings_info():
    """Test GET /admin/recordings/info"""
    print("\n=== Testing GET /admin/recordings/info ===")
    try:
        response = requests.get(f"{BASE_URL}/admin/recordings/info", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_session_cleanup(session_id):
    """Test DELETE /admin/recordings/session/{session_id}"""
    print(f"\n=== Testing DELETE /admin/recordings/session/{session_id} ===")
    try:
        response = requests.delete(
            f"{BASE_URL}/admin/recordings/session/{session_id}",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_full_cleanup():
    """Test DELETE /admin/recordings/cleanup"""
    print("\n=== Testing DELETE /admin/recordings/cleanup ===")
    print("⚠️  WARNING: This will delete ALL recordings!")
    confirm = input("Type 'yes' to continue: ")
    if confirm.lower() != 'yes':
        print("Aborted.")
        return False
    
    try:
        response = requests.delete(f"{BASE_URL}/admin/recordings/cleanup", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Admin Endpoints Test Script")
    print("=" * 50)
    
    # Test 1: Get info (safe)
    test_recordings_info()
    
    # Test 2: Session cleanup (if session ID provided)
    session_id = input("\nEnter session ID to test cleanup (or press Enter to skip): ").strip()
    if session_id:
        test_session_cleanup(session_id)
    
    # Test 3: Full cleanup (dangerous - requires confirmation)
    do_full = input("\nTest full cleanup? (y/n): ").strip().lower()
    if do_full == 'y':
        test_full_cleanup()
    
    print("\n" + "=" * 50)
    print("Tests complete!")

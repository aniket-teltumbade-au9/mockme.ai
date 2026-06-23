#!/usr/bin/env python3
"""
Quick test to verify admin endpoint paths are correct
Run this before starting the server to validate path resolution
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.storage import get_storage_dir

def test_paths():
    print("=" * 60)
    print("Admin Endpoint Path Verification")
    print("=" * 60)
    
    # Get the recordings directory path
    recordings_dir = get_storage_dir()
    
    print(f"\n✓ get_storage_dir() returns:")
    print(f"  {recordings_dir}")
    
    # Check if it exists
    exists = os.path.exists(recordings_dir)
    print(f"\n✓ Directory exists: {exists}")
    
    # List files if exists
    if exists:
        files = os.listdir(recordings_dir)
        print(f"\n✓ Files in directory: {len(files)}")
        if files:
            print("  Files:")
            for f in files[:10]:  # Show first 10
                file_path = os.path.join(recordings_dir, f)
                size = os.path.getsize(file_path)
                print(f"    - {f} ({size} bytes)")
            if len(files) > 10:
                print(f"    ... and {len(files) - 10} more")
        else:
            print("  (empty directory)")
    
    # Check what the OLD incorrect code would have returned
    old_incorrect_path = os.path.join(recordings_dir, "recordings")
    print(f"\n✗ OLD incorrect path would have been:")
    print(f"  {old_incorrect_path}")
    print(f"  Exists: {os.path.exists(old_incorrect_path)}")
    
    print("\n" + "=" * 60)
    print("Verification Summary:")
    print("=" * 60)
    
    if exists:
        print("✅ CORRECT: Admin endpoints will find the recordings directory")
        print(f"✅ Path: {recordings_dir}")
    else:
        print("⚠️  WARNING: Recordings directory doesn't exist yet")
        print("   (This is OK - it will be created when needed)")
    
    print("\n" + "=" * 60)
    return exists

if __name__ == "__main__":
    test_paths()

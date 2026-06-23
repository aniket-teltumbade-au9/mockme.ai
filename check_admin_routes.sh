#!/bin/bash

echo "🔍 Checking Admin Routes Registration..."
echo "=========================================="

cd /home/settlin/mockme/backend

# Check if routes are registered
python3 << PYTHON
import sys
sys.path.insert(0, '.')

try:
    from app.main import app
    
    admin_routes = []
    for route in app.routes:
        if hasattr(route, 'path') and 'admin' in route.path:
            methods = ', '.join(sorted(route.methods)) if hasattr(route, 'methods') and route.methods else 'N/A'
            admin_routes.append(f"{methods:15} {route.path}")
    
    if admin_routes:
        print("✅ Admin routes found:")
        for route in admin_routes:
            print(f"   {route}")
    else:
        print("❌ No admin routes found!")
        
    print("\n📝 Correct URLs to use:")
    print("   GET    http://localhost:8000/api/admin/recordings/info")
    print("   DELETE http://localhost:8000/api/admin/recordings/cleanup")
    print("   DELETE http://localhost:8000/api/admin/recordings/session/{session_id}")
    
except Exception as e:
    print(f"❌ Error loading routes: {e}")
    import traceback
    traceback.print_exc()
PYTHON

echo ""
echo "=========================================="
echo "�� If you're getting 404 errors:"
echo "   1. Clear Python cache: find . -name '*.pyc' -delete"
echo "   2. Restart backend server: uvicorn app.main:app --reload"
echo "   3. Verify URL: http://localhost:8000/api/admin/recordings/cleanup"
echo "=========================================="

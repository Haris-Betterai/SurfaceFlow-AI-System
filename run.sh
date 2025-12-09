#!/bin/bash

# SurfaceFlow AI System - Run Script
# This script clears caches and starts both frontend and backend servers

echo "🌊 SurfaceFlow AI System - Starting..."
echo "========================================"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# ========== CLEAR CACHES ==========
echo -e "${BLUE}🧹 Clearing caches...${NC}"

# Clear Python cache
echo "   Clearing Python __pycache__..."
find "$SCRIPT_DIR/backend" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find "$SCRIPT_DIR/backend" -type f -name "*.pyc" -delete 2>/dev/null

# Clear Next.js cache
echo "   Clearing Next.js .next cache..."
rm -rf "$SCRIPT_DIR/frontend/.next" 2>/dev/null

# Clear node_modules/.cache if exists
echo "   Clearing node_modules cache..."
rm -rf "$SCRIPT_DIR/frontend/node_modules/.cache" 2>/dev/null

echo -e "${GREEN}✅ Caches cleared!${NC}"
echo ""

# ========== START BACKEND ==========
echo -e "${BLUE}🚀 Starting Django Backend on http://127.0.0.1:8000${NC}"
cd "$SCRIPT_DIR/backend"

# Activate virtual environment and run Django
if [ -d "venv" ]; then
    source venv/bin/activate
    python manage.py runserver 0.0.0.0:8000 &
    BACKEND_PID=$!
    echo -e "${GREEN}   Backend PID: $BACKEND_PID${NC}"
else
    echo -e "${RED}❌ Error: Virtual environment not found at backend/venv${NC}"
    echo "   Run: cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Wait a moment for backend to start
sleep 2

# ========== START FRONTEND ==========
echo ""
echo -e "${BLUE}🚀 Starting Next.js Frontend on http://localhost:3000${NC}"
cd "$SCRIPT_DIR/frontend"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    npm run dev &
    FRONTEND_PID=$!
    echo -e "${GREEN}   Frontend PID: $FRONTEND_PID${NC}"
else
    echo -e "${RED}❌ Error: node_modules not found${NC}"
    echo "   Run: cd frontend && npm install"
    exit 1
fi

# ========== RUNNING ==========
echo ""
echo "========================================"
echo -e "${GREEN}✅ SurfaceFlow AI System is running!${NC}"
echo ""
echo -e "   ${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "   ${BLUE}Backend:${NC}  http://127.0.0.1:8000"
echo -e "   ${BLUE}API:${NC}      http://127.0.0.1:8000/api/v1/"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo "========================================"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

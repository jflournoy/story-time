#!/bin/bash
set -e

echo "Setting up Python LLM Service..."

cd services

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Setup complete!"
echo ""
echo "To start the service:"
echo "  npm run llm:start"
echo ""
echo "To start in development mode:"
echo "  npm run llm:dev"
echo ""
echo "To run both backend and LLM service:"
echo "  npm run dev:local"

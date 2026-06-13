#!/bin/bash

# Setup script for Sim-Pesa development environment

echo "Setting up Sim-Pesa development environment..."

# 1. Copy .env.example to .env if it doesnt exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
else
    echo ".env already exists, skipping."
fi

# 2. Install dependencies
echo "Installing dependencies..."
npm install

echo "Setup complete!"
echo "To start the development infrastructure: docker compose -f docker-compose.dev.yml up -d"
echo "To start the services: npm run dev"

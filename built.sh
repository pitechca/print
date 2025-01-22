#!/usr/bin/env bash
# exit on error
set -o errexit

# Build frontend
cd frontend
npm install
npm run build

# Build backend
cd ../backend
npm install

# Return to root
cd ..
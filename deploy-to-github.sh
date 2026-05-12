#!/bin/bash
# Warriors Arena — GitHub Deploy Script
# Run this from the warriors-arena project folder

set -e

echo "🔧 Removing stale git lock if present..."
rm -f .git/index.lock

echo "📦 Staging changes..."
git add src/components/public/booking/Step1Game.tsx

echo "💾 Committing..."
git commit -m "fix: add 'use client' directive to Step1Game component

Required for Next.js App Router — component uses hooks (useEffect,
useState, useTranslations, useLocale) and must be a Client Component."

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Done! Check GitHub to confirm."

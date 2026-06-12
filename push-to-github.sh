#!/bin/bash
# Run this in the Replit Shell tab to push to GitHub
# Usage: bash push-to-github.sh YOUR_GITHUB_TOKEN

TOKEN=$1
if [ -z "$TOKEN" ]; then
  echo "Usage: bash push-to-github.sh YOUR_GITHUB_TOKEN"
  exit 1
fi

REPO="https://${TOKEN}@github.com/YanPhyoAung-123/xianxia-novels.git"

git config user.email "translator@novelapp.com"
git config user.name "Novel Translator"
git remote remove origin 2>/dev/null
git remote add origin "$REPO"
git add -A
git commit -m "Novel Translator app" --allow-empty
git push --force origin HEAD:main

echo "Done! Check https://github.com/YanPhyoAung-123/xianxia-novels"

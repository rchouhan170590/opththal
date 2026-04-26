#!/bin/bash
# Run this from your terminal to copy the site into your opththal repo
# Usage: bash deploy-to-repo.sh

SRC="$(dirname "$0")"
DEST="/Users/rchouhan/code/personal/medical/opththal"

echo "Copying site files from: $SRC"
echo "Destination repo:        $DEST"
echo ""

# Copy all files preserving structure
rsync -av --exclude='.git' --exclude='deploy-to-repo.sh' "$SRC/" "$DEST/"

echo ""
echo "Done! Now run:"
echo "  cd $DEST"
echo "  git add -A && git commit -m 'Add ophthalmology study portal' && git push"

#!/bin/zsh
cd "/Users/joshualukeparris/.openclaw/workspace/multi-layer-zoom-game"

echo "Starting Multi-Layer Zoom Game..."
echo

chmod +x setup-and-run.sh
./setup-and-run.sh

echo
echo "If the server stopped or failed, copy the error above."
echo "Press any key to close."
read -k 1

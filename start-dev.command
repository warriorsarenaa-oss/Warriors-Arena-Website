#!/bin/bash
# Warriors Arena — Dev Server Launcher
# Double-click this file in Finder to start the dev server
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
echo "Starting Warriors Arena dev server..."
echo "Project: $DIR"
npm run dev

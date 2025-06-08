#!/bin/bash

# AutoDev GitHub Agent Action - Release Preparation Script
# This script prepares the action for publishing to GitHub Actions Marketplace

set -e

echo "🚀 Preparing AutoDev GitHub Agent Action for release..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$(dirname "$ACTION_DIR")")"

echo -e "${BLUE}📁 Action directory: $ACTION_DIR${NC}"
echo -e "${BLUE}📁 Root directory: $ROOT_DIR${NC}"

# Step 1: Build the action
echo -e "\n${YELLOW}📦 Step 1: Building the action...${NC}"
cd "$ACTION_DIR"
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi
echo -e "${GREEN}✅ Build completed${NC}"

# Step 2: Create release directory
RELEASE_DIR="$ROOT_DIR/github-agent-action-release"
echo -e "\n${YELLOW}📂 Step 2: Creating release directory...${NC}"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

# Step 3: Copy necessary files
echo -e "\n${YELLOW}📋 Step 3: Copying files...${NC}"
cp "$ACTION_DIR/action.yml" "$RELEASE_DIR/"
cp "$ACTION_DIR/LICENSE" "$RELEASE_DIR/"
cp "$ACTION_DIR/README.md" "$RELEASE_DIR/"
cp "$ACTION_DIR/MARKETPLACE.md" "$RELEASE_DIR/"
cp -r "$ACTION_DIR/dist" "$RELEASE_DIR/"

# Create a simplified package.json for the release
cat > "$RELEASE_DIR/package.json" << EOF
{
  "name": "github-agent-action",
  "version": "1.0.0",
  "description": "Automated GitHub issue analysis using AI-powered code analysis",
  "main": "dist/index.js",
  "keywords": [
    "github",
    "actions",
    "automation",
    "issue-analysis",
    "ai",
    "typescript"
  ],
  "author": "AutoDev authors",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/unit-mesh/github-agent-action.git"
  },
  "bugs": {
    "url": "https://github.com/unit-mesh/github-agent-action/issues"
  },
  "homepage": "https://github.com/unit-mesh/github-agent-action#readme"
}
EOF

# Step 4: Create .gitignore
cat > "$RELEASE_DIR/.gitignore" << EOF
node_modules/
*.log
.env
.DS_Store
EOF

# Step 5: Create GitHub workflow for the action repository
mkdir -p "$RELEASE_DIR/.github/workflows"
cat > "$RELEASE_DIR/.github/workflows/test.yml" << EOF
name: Test Action

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Test Action
        uses: ./
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          analysis-depth: shallow
          auto-comment: false
          auto-label: false
        env:
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
EOF

echo -e "\n${GREEN}✅ Release preparation completed!${NC}"
echo -e "\n${BLUE}📁 Release files are in: $RELEASE_DIR${NC}"

echo -e "\n${YELLOW}🔄 Next steps:${NC}"
echo -e "1. ${BLUE}Create a new GitHub repository${NC} named 'github-agent-action'"
echo -e "2. ${BLUE}Initialize the repository${NC} with the files in $RELEASE_DIR"
echo -e "3. ${BLUE}Create a release${NC} with tag v1.0.0"
echo -e "4. ${BLUE}Publish to Marketplace${NC} from the release page"

echo -e "\n${YELLOW}📋 Commands to run:${NC}"
echo -e "${BLUE}cd $RELEASE_DIR${NC}"
echo -e "${BLUE}git init${NC}"
echo -e "${BLUE}git add .${NC}"
echo -e "${BLUE}git commit -m \"Initial release v1.0.0\"${NC}"
echo -e "${BLUE}git branch -M main${NC}"
echo -e "${BLUE}git remote add origin https://github.com/YOUR_USERNAME/github-agent-action.git${NC}"
echo -e "${BLUE}git push -u origin main${NC}"

echo -e "\n${GREEN}🎉 Ready for marketplace publication!${NC}"

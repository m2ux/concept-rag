#!/bin/bash
# Setup script for Python layout detection environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🐍 Setting up Python environment for layout detection..."

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "   Python version: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "📥 Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing requirements..."
pip install -r requirements.txt

# Install Detectron2
echo "📥 Installing Detectron2 (this may take a few minutes)..."
pip install 'git+https://github.com/facebookresearch/detectron2.git'

# Verify installation
echo "✅ Verifying installation..."
python -c "import layoutparser as lp; print('   LayoutParser:', lp.__version__)"
python -c "import detectron2; print('   Detectron2: installed')"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use the classifier:"
echo "   source scripts/python/venv/bin/activate"
echo "   python scripts/python/classify_visual.py classify <image_path>"
echo ""
echo "Or from TypeScript (auto-detects venv):"
echo "   import { classifyImage } from './local-classifier.js'"


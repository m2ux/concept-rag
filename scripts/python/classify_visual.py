#!/usr/bin/env python3
"""
Classify images using LayoutParser local model.

Supports two modes:
1. CLASSIFY: Is this image a diagram/table/skip? (for native PDF images)
2. DETECT: Find diagram regions within a page image (for scanned PDFs)

Usage:
    # Classify a single image (native PDF)
    python classify_visual.py classify <image_path> [--min-score 0.5]
    
    # Detect regions in a page image (scanned PDF)
    python classify_visual.py detect <image_path> [--min-score 0.5]

Output:
    JSON with classification result or detected regions
"""

import sys
import json
import argparse
import os

# Suppress torch warnings
os.environ['PYTORCH_ENABLE_MPS_FALLBACK'] = '1'
import warnings
warnings.filterwarnings('ignore', category=UserWarning)

try:
    import layoutparser as lp
    from PIL import Image
    LAYOUTPARSER_AVAILABLE = True
except ImportError:
    LAYOUTPARSER_AVAILABLE = False

# Load pre-trained model (cached after first load)
MODEL = None

def get_model():
    """Get or initialize the LayoutParser model."""
    global MODEL
    if MODEL is None:
        if not LAYOUTPARSER_AVAILABLE:
            raise RuntimeError(
                "LayoutParser not installed. Run:\n"
                "  cd scripts/python && python -m venv venv && source venv/bin/activate\n"
                "  pip install -r requirements.txt\n"
                "  pip install 'git+https://github.com/facebookresearch/detectron2.git'"
            )
        
        # PubLayNet model - trained on 330k+ scientific documents
        # Detects: Text, Title, List, Table, Figure
        
        # Check for local model weights to avoid Dropbox URL parsing issues
        import os
        home = os.path.expanduser("~")
        local_weights = os.path.join(home, ".torch/iopath_cache/s/dgy9c10wykk4lq4/model_final.pth")
        local_config = os.path.join(home, ".torch/iopath_cache/s/f3b12qc4hc0yh4m/config.yml")
        
        if os.path.exists(local_weights) and os.path.exists(local_config):
            # Use local files directly
            MODEL = lp.Detectron2LayoutModel(
                config_path=local_config,
                model_path=local_weights,
                extra_config=["MODEL.ROI_HEADS.SCORE_THRESH_TEST", 0.3],
                label_map={0: "Text", 1: "Title", 2: "List", 3: "Table", 4: "Figure"}
            )
        else:
            # Fall back to LayoutParser's default download
            MODEL = lp.Detectron2LayoutModel(
                config_path='lp://PubLayNet/faster_rcnn_R_50_FPN_3x/config',
                extra_config=["MODEL.ROI_HEADS.SCORE_THRESH_TEST", 0.3],
                label_map={0: "Text", 1: "Title", 2: "List", 3: "Table", 4: "Figure"}
            )
    return MODEL


def classify_image(image_path: str, min_score: float = 0.5) -> dict:
    """
    Classify a single image (from pdfimages extraction).
    
    Determines if the image is primarily a Figure or Table.
    Returns the dominant element type, or 'skip' if no figure/table detected.
    
    Args:
        image_path: Path to the image file
        min_score: Minimum confidence score (0-1)
    
    Returns:
        dict with keys: type, score, skip
    """
    image = Image.open(image_path).convert("RGB")
    model = get_model()
    
    layout = model.detect(image)
    
    # Find the largest/highest-confidence figure or table
    best_match = None
    best_score = 0
    image_area = image.width * image.height
    
    for block in layout:
        if block.score >= min_score and block.type in ["Figure", "Table"]:
            # Score combines confidence and relative area
            block_area = block.block.width * block.block.height
            combined_score = block.score * (block_area / image_area)
            
            if combined_score > best_score:
                best_score = combined_score
                best_match = block
    
    if best_match:
        # Map to visual types used by concept-rag
        visual_type = "figure" if best_match.type == "Figure" else "table"
        return {
            "type": visual_type,
            "score": round(best_match.score, 3),
            "skip": False
        }
    else:
        return {
            "type": "skip",
            "score": 0,
            "skip": True
        }


def detect_regions(image_path: str, min_score: float = 0.5) -> list:
    """
    Detect all figure/table regions in a page image (for scanned PDFs).
    
    Returns bounding boxes for each detected region that can be cropped.
    
    Args:
        image_path: Path to the page image
        min_score: Minimum confidence score (0-1)
    
    Returns:
        List of dicts with keys: type, score, bbox
    """
    image = Image.open(image_path).convert("RGB")
    model = get_model()
    
    layout = model.detect(image)
    
    results = []
    for block in layout:
        if block.score >= min_score and block.type in ["Figure", "Table"]:
            # Map to visual types used by concept-rag
            visual_type = "figure" if block.type == "Figure" else "table"
            
            results.append({
                "type": visual_type,
                "score": round(block.score, 3),
                "bbox": {
                    "x": int(block.block.x_1),
                    "y": int(block.block.y_1),
                    "width": int(block.block.width),
                    "height": int(block.block.height)
                }
            })
    
    # Sort by position (top to bottom, left to right)
    results.sort(key=lambda r: (r["bbox"]["y"], r["bbox"]["x"]))
    
    return results


def main():
    parser = argparse.ArgumentParser(
        description="Classify document images using local layout detection model"
    )
    parser.add_argument(
        "mode", 
        choices=["classify", "detect"],
        help="classify: single image classification, detect: find regions in page"
    )
    parser.add_argument(
        "image_path", 
        help="Path to image file"
    )
    parser.add_argument(
        "--min-score", 
        type=float, 
        default=0.5,
        help="Minimum confidence score (0-1, default: 0.5)"
    )
    
    args = parser.parse_args()
    
    # Verify image exists
    if not os.path.exists(args.image_path):
        print(json.dumps({"error": f"Image not found: {args.image_path}"}))
        sys.exit(1)
    
    try:
        if args.mode == "classify":
            result = classify_image(args.image_path, args.min_score)
        else:
            result = detect_regions(args.image_path, args.min_score)
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()


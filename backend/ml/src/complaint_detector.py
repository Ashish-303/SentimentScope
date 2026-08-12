"""
Rule-Based Complaint Detector for SentimentScope.

Identifies operational complaints and customer pain points across universal
and product-category-specific aspect taxonomies.
"""

import os
import sys
from typing import List, Optional

# Ensure ML src directory is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from product_category_taxonomy import extract_complaints, UNIVERSAL_COMPLAINTS, CATEGORY_SPECIFIC_COMPLAINTS


def detect_issue(
    review: str,
    category: Optional[str] = None,
    sentiment: Optional[str] = None
) -> List[str]:
    """
    Extracts complaint aspects from review text using product-category-aware taxonomy.

    Args:
        review: Raw user review text string.
        category: Optional product category string (e.g. 'Electronics', 'Fashion').
        sentiment: Optional predicted sentiment string.

    Returns:
        List of identified complaint category names.
    """
    return extract_complaints(review, product_category=category, sentiment=sentiment)


if __name__ == "__main__":
    test_reviews = [
        ("Delivery was delayed by 5 days", "Home & Kitchen"),
        ("The product stopped working after 2 days", "Electronics"),
        ("The package arrived damaged", "Sports & Outdoors"),
        ("Customer support never replied", "Tools & Appliances"),
        ("Battery drains fast and charging is slow", "Electronics"),
        ("Bluetooth pairing does not work", "Electronics"),
        ("The product is too expensive for the features offered", "Fashion"),
        ("The shirt fits too tight and stitching is coming out", "Fashion"),
        ("Cream caused severe skin rash and burning sensation", "Beauty"),
        ("Not satisfied with the quality", "Home & Kitchen")
    ]

    for rev, cat in test_reviews:
        print(f"Review:   {rev}")
        print(f"Category: {cat}")
        print(f"Detected: {detect_issue(rev, category=cat)}")
        print("-" * 60)
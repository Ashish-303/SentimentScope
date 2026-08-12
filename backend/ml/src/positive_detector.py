"""
Rule-Based Positive Highlight Detector for SentimentScope.

Identifies product highlights, strengths, and customer delight signals across
universal and product-category-specific aspect taxonomies with negation guarding.
"""

import os
import sys
from typing import List, Optional

# Ensure ML src directory is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from product_category_taxonomy import extract_positive_highlights, UNIVERSAL_HIGHLIGHTS, CATEGORY_SPECIFIC_HIGHLIGHTS


def detect_positive_features(
    review: str,
    category: Optional[str] = None,
    sentiment: Optional[str] = None,
    use_sentiment_fallback: bool = True
) -> List[str]:
    """
    Extracts positive highlight aspects from review text using product-category-aware taxonomy.

    Args:
        review: Raw user review text string.
        category: Optional product category string (e.g. 'Electronics', 'Fashion').
        sentiment: Optional predicted sentiment string.
        use_sentiment_fallback: Whether to use conservative sentiment-aware fallback.

    Returns:
        List of identified positive highlight category names.
    """
    return extract_positive_highlights(
        review,
        product_category=category,
        sentiment=sentiment,
        use_sentiment_fallback=use_sentiment_fallback
    )


if __name__ == "__main__":
    test_reviews = [
        ("Excellent quality and works perfectly", "Home & Kitchen", "Positive"),
        ("Worth every penny. Great value.", "Sports & Outdoors", "Positive"),
        ("Fast delivery and beautiful packaging", "Tools & Appliances", "Positive"),
        ("Easy to use and durable", "Home & Kitchen", "Positive"),
        ("Stylish design and great features", "Electronics", "Positive"),
        ("The bass is super and sound quality is great", "Electronics", "Positive"),
        ("The shirt fits perfectly and fabric is soft", "Fashion", "Positive"),
        ("Smells wonderful and gentle on skin", "Beauty", "Positive"),
        ("Not good quality, doesn't work", "Electronics", "Negative"),
        ("Worst product ever", "Home & Kitchen", "Negative")
    ]

    for rev, cat, sent in test_reviews:
        print(f"Review:    {rev}")
        print(f"Category:  {cat} | Sentiment: {sent}")
        print(f"Detected:  {detect_positive_features(rev, category=cat, sentiment=sent)}")
        print("-" * 60)
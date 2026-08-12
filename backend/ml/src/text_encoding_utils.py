"""
Text Encoding Normalization Utilities for SentimentScope.

Provides non-destructive string sanitization for fixing upstream double-encoding (mojibake)
artifacts in text fields.

NOTE: This utility is for future ingestion pipelines. It MUST NOT mutate the frozen canonical dataset.
"""

import re
from typing import Optional


# Known common Windows-1252 / UTF-8 double-encoding replacement table
ENCODING_REPLACEMENTS = {
    "â€™": "'",
    "â€˜": "'",
    "â€œ": '"',
    "â€\x9d": '"',
    "â€": '"',
    "â€“": "-",
    "â€”": "--",
    "â€¦": "...",
    "Ã©": "e",
    "Ã¨": "e",
    "Ã ": "a",
    "Ã¡": "a",
    "Ã³": "o",
    "Ã±": "n",
    "Â": "",
}

REPLACEMENT_REGEX = re.compile("|".join(re.escape(k) for k in ENCODING_REPLACEMENTS.keys()))


def fix_mojibake(text: Optional[str]) -> str:
    """
    Normalizes common double-encoded UTF-8 / Windows-1252 character artifacts.

    Args:
        text (str): Input text string possibly containing mojibake.

    Returns:
        str: Cleaned text string with standard ASCII/UTF-8 characters.
    """
    if text is None or not isinstance(text, str):
        return ""
    
    # Fast path regex replacement
    cleaned = REPLACEMENT_REGEX.sub(lambda m: ENCODING_REPLACEMENTS[m.group(0)], text)
    
    # Fallback to ftfy if installed and available
    try:
        import ftfy
        cleaned = ftfy.fix_text(cleaned)
    except ImportError:
        pass

    return cleaned.strip()


def sanitize_product_title(title: Optional[str]) -> str:
    """
    Sanitizes e-commerce product titles specifically.

    Args:
        title (str): Raw product title.

    Returns:
        str: Sanitized product title.
    """
    return fix_mojibake(title)

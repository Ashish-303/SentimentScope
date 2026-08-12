"""
Product-Category-Aware Aspect Taxonomies and Matching Engine for SentimentScope.

Defines hierarchical aspect categories (Universal + Category-Specific) and safe,
boundary-aware matching and negation-detection utilities for rule-based heuristics.
"""

import re
from typing import List, Dict, Set, Optional, Tuple

# Supported Product Categories in Canonical Dataset
KNOWN_PRODUCT_CATEGORIES = {
    "Home & Kitchen",
    "Sports & Outdoors",
    "Electronics",
    "Fashion",
    "Beauty",
    "Tools & Appliances",
    "Toys & Games",
    "Health & Personal Care"
}

# Universal Negation Tokens for Rule-Based Guarding
NEGATION_TOKENS: Set[str] = {
    "not", "no", "never", "neither", "nor", "without",
    "hardly", "barely", "low", "poor", "bad", "worst",
    "dont", "doesnt", "didnt", "isnt", "arent", "wasnt",
    "werent", "cannot", "cant", "couldnt", "wont"
}


# ==============================================================================
# COMPLAINT TAXONOMY (UNIVERSAL + CATEGORY-SPECIFIC)
# ==============================================================================

UNIVERSAL_COMPLAINTS: Dict[str, List[str]] = {
    "Delivery": [
        r"\b(?:delivery|shipping|courier|logistics)\b",
        r"\blate\s+delivery\b",
        r"\bdelayed?\b",
        r"\barrived\s+late\b",
        r"\btook\s+forever\b",
        r"\bshipment\s+delayed\b",
        r"\bwrong\s+address\b",
        r"\blost\s+in\s+transit\b",
        r"\bnever\s+delivered\b",
        r"\bdelivery\s+(?:boy|guy|man)\b",
        r"\blate\b"
    ],
    "Packaging": [
        r"\b(?:package|packaging|box)\b",
        r"\bpoor\s+packaging\b",
        r"\bdamaged\s+package\b",
        r"\btorn\s+box\b",
        r"\bno\s+bubble\s*wrap\b",
        r"\bpoorly\s+packed\b",
        r"\bpackaging\s+was\s+bad\b",
        r"\bbox\s+was\s+crushed\b",
        r"\bseal\s+broken\b",
        r"\bunsealed\b"
    ],
    "Quality": [
        r"\b(?:broken|defective|faulty|damaged|malfunctioning|defect)\b",
        r"\b(?:poor|bad|cheap|worst|low|terrible)\s+quality\b",
        r"\bstopped\s+working\b",
        r"\b(?:not|does\s*n'?t|doesn'?t|no)\s+working\b",
        r"\b(?:not|does\s*n'?t|doesn'?t)\s+work\b",
        r"\bbroke\b",
        r"\bcracked\b",
        r"\bmanufacturing\s+defect\b",
        r"\bdead\s+on\s+arrival\b",
        r"\bnot\s+functioning\b",
        r"\bquiltey\b",
        r"\bcolour\s+fade\b",
        r"\bcolor\s+fade\b",
        r"\bquality\s+(?:not\s+upto\s+the\s+mark|is\s+not\s+good|low)\b",
        r"\bplastic\s+use\s+products\b"
    ],
    "Performance": [
        r"\b(?:slow|lag|lagging|freezing|freezes|hangs|sluggish|buggy|unresponsive)\b",
        r"\bperformance\b",
        r"\bspeed\b",
        r"\bnot\s+smooth\b",
        r"\bnoisy\s+creat\s+motor\b",
        r"\bleakage\b",
        r"\bno\s+fast\b",
        r"\bvoice\s+command\s+is\s+so\s+poor\b"
    ],
    "Battery": [
        r"\bbattery\b",
        r"\bcharg(?:ing|e|er)\b",
        r"\bdrains?\s+fast\b",
        r"\bbattery\s+life\b",
        r"\bbattery\s+drain\b",
        r"\bnot\s+charging\b",
        r"\bcharging\s+issue\b",
        r"\bdead\s+battery\b",
        r"\bbattery\s+backup\b",
        r"\bpoor\s+battery\b",
        r"\bdoes\s*n'?t\s+hold\s+charge\b",
        r"\boverheating\b"
    ],
    "Compatibility": [
        r"\bcompatib(?:le|ility)\b",
        r"\bconnect(?:ivity|ions?|ing|ed)?\b",
        r"\bbluetooth\b",
        r"\bpairing\b",
        r"\bsync(?:ing)?\b",
        r"\bnot\s+supported\b",
        r"\bwifi\b",
        r"\bwifi\s+issue\b",
        r"\bdisconnects?\b",
        r"\bkeeps\s+disconnecting\b",
        r"\bwo\s*n'?t\s+pair\b",
        r"\bnot\s+usb\s+operated\b",
        r"\bsupported\b"
    ],
    "Service": [
        r"\b(?:customer\s+support|customer\s+care|help\s*desk)\b",
        r"\b(?:support|refund|seller|service|services|replacement|warranty)\b",
        r"\bno\s+response\b",
        r"\bwarranty\s+claim\b",
        r"\breturn\s+process\b",
        r"\brude\s+staff\b",
        r"\bunhelpful\s+support\b",
        r"\bworst\s+experience\b"
    ],
    "Pricing": [
        r"\b(?:expensive|overpriced|costly)\b",
        r"\btoo\s+costly\b",
        r"\bnot\s+worth\s+(?:the\s+price|it)\b",
        r"\bhigh\s+price\b",
        r"\bprice\s+(?:of\s+product\s+is\s+high|too\s+high)\b",
        r"\bwaste\s+of\s+money\b",
        r"\bcost\b",
        r"\bprice\b"
    ],
    "Features": [
        r"\bfeatures?\b",
        r"\bfunctions?\b",
        r"\boptions?\b",
        r"\bno\s+option\b",
        r"\bmissing\s+feature\b"
    ],
    "Disappointment": [
        r"\b(?:disappointed|disappointment|terrible|horrible)\b",
        r"\bworst\s+(?:purchase|product|experience|item|dont\s+buy)\b",
        r"\b(?:do\s*n'?t|dont)\s+buy\b",
        r"\bbad\s+experience\b",
        r"\bwaste\s+of\s+money\b",
        r"\bnot\s+worth\s+it\b",
        r"\buseless\s+product\b"
    ],
    "Durability": [
        r"\bwear\s+out\b",
        r"\bwore\s+out\b",
        r"\bdid\s*n'?t\s+last\b",
        r"\bbroke\s+after\b",
        r"\bfell\s+apart\b",
        r"\bnot\s+durable\b",
        r"\bflimsy\s+build\b",
        r"\bcheaply\s+built\b",
        r"\bsnapped\b",
        r"\brusted?\b",
        r"\brusting\b",
        r"\bchipped\b",
        r"\bdurability\b",
        r"\bdurable\b"
    ],
    "Size & Fit": [
        r"\btoo\s+small\b",
        r"\btoo\s+large\b",
        r"\btoo\s+big\b",
        r"\b(?:size|fit|fitting)\s+issue\b",
        r"\bwrong\s+size\b",
        r"\bdoes\s*n'?t\s+fit\b",
        r"\bsize\s+not\s+fit\b",
        r"\bsize\s+is\s+smaller\b",
        r"\bruns\s+(?:small|large)\b",
        r"\btoo\s+tight\b",
        r"\bsmall\s+only\b"
    ],
    "Accuracy": [
        r"\b(?:incorrect|wrong|inaccurate|wrongplease)\b"
    ]
}

CATEGORY_SPECIFIC_COMPLAINTS: Dict[str, Dict[str, List[str]]] = {
    "Electronics": {
        "Sound Quality": [
            r"\b(?:sound\s+quality|bad\s+sound|distorted|distortion|bass|no\s+bass|low\s+volume|static\s+noise|crackling|muffled|audio\s+issue|speaker\s+issue|poor\s+audio)\b"
        ],
        "Display & Screen": [
            r"\b(?:screen|display|dead\s+pixel|flickering|screen\s+crack|cracked\s+screen|dim\s+display|touch\s+not\s+working)\b"
        ],
        "Camera & Media": [
            r"\b(?:camera|picture\s+quality|photo\s+quality|video\s+quality|blurry|grainy)\b"
        ],
        "Heating": [
            r"\b(?:overheating|overheats|heats?\s+up|too\s+hot|heating\s+issue|burning\s+smell)\b"
        ]
    },
    "Fashion": {
        "Material & Fabric": [
            r"\b(?:fabric|stitching|stitch|poor\s+stitching|thread\s+coming\s+out|rough\s+fabric|material\s+quality|thin\s+fabric)\b",
            r"\b(?:colour\s+fade|color\s+fade|faded|shrunk|shrinking)\b"
        ]
    },
    "Beauty": {
        "Safety & Skin Reaction": [
            r"\b(?:rash|allergic|skin\s+irritation|burning\s+sensation|chemical\s+smell|broke\s+out|bad\s+smell|harmful|unsafe)\b"
        ]
    },
    "Health & Personal Care": {
        "Safety & Skin Reaction": [
            r"\b(?:rash|allergic|skin\s+irritation|burning\s+sensation|chemical\s+smell|side\s+effect|bad\s+smell|harmful|unsafe)\b"
        ]
    },
    "Toys & Games": {
        "Safety & Skin Reaction": [
            r"\b(?:unsafe|choking\s+hazard|sharp\s+edges|harmful\s+material)\b"
        ]
    }
}


# ==============================================================================
# POSITIVE HIGHLIGHT TAXONOMY (UNIVERSAL + CATEGORY-SPECIFIC)
# ==============================================================================

UNIVERSAL_HIGHLIGHTS: Dict[str, List[str]] = {
    "Quality": [
        r"\b(?:excellent|great|high|premium|top|best|super|amazing)\s+quality\b",
        r"\bwell\s+made\b",
        r"\btop\s+notch\b",
        r"\bhighly\s+recommend(?:ed)?\b",
        r"\b(?:great|excellent|super|best)\s+product\b",
        r"\bquality\s+product\b",
        r"\bbest\s+quality\b",
        r"\bgood\s+condition\b",
        r"\bquality\s+is\s+(?:super|good|great|best)\b"
    ],
    "Performance": [
        r"\bworks?\s+(?:perfect|perfectlys?|great|fast|flawlessly|well)\b",
        r"\b(?:great|fast|smooth|responsive|efficient)\s+performance\b",
        r"\bruns?\s+fast\b",
        r"\bworking\s+properly\b"
    ],
    "Features": [
        r"\b(?:great|useful|lots\s+of|excellent)\s+features?\b",
        r"\bfeature\s+rich\b",
        r"\bexactly\s+what\s+i\s+needed\b"
    ],
    "Packaging": [
        r"\b(?:well|beautifully|nicely|great|good)\s+pack(?:ed|aging)?\b",
        r"\bgood\s+pack\b"
    ],
    "Delivery": [
        r"\b(?:fast|quick)\s+delivery\b",
        r"\barrived\s+on\s+time\b",
        r"\bdelivered\s+quickly\b",
        r"\bfast\s+shipping\b",
        r"\bon\s+time\s+delivered\b",
        r"\bdelivered\s+on\s+\d+(?:st|nd|rd|th)?\b"
    ],
    "Value for Money": [
        r"\bworth\s+(?:the\s+price|every\s+penny)\b",
        r"\bvalue\s+(?:for|of)\s+money\b",
        r"\b(?:great|good)\s+value\b",
        r"\bwell\s+worth\s+the\s+price\b",
        r"\bgood\s+price\b",
        r"\bgood\s+deal\b",
        r"\bvery\s+good\s+price\b"
    ],
    "Design": [
        r"\b(?:beautiful|stylish|attractive|nice)\s+design\b",
        r"\blooks?\s+(?:great|very\s+decent|nice)\b"
    ],
    "Ease of Use": [
        r"\b(?:easy|simple)\s+to\s+use\b",
        r"\buser\s+friendly\b",
        r"\beasy\s+setup\b",
        r"\bself\s+assemble\b"
    ],
    "Durability": [
        r"\b(?:durable|long\s+lasting|sturdy|solid\s+build|strong)\b",
        r"\ba\s+sturdy\s+product\b"
    ]
}

CATEGORY_SPECIFIC_HIGHLIGHTS: Dict[str, Dict[str, List[str]]] = {
    "Electronics": {
        "Battery": [
            r"\b(?:good|great|long)\s+battery\s*(?:life|backup)?\b",
            r"\bfast\s+charging\b",
            r"\bbattery\s+lasts\b"
        ],
        "Sound Quality": [
            r"\b(?:great|good|super|excellent|best|superb)\s+sound(?:\s+quality)?\b",
            r"\bbass\s+quality\s+super\b",
            r"\b(?:good|super|great|deep)\s+bass\b"
        ],
        "Display & Screen": [
            r"\b(?:great|good|clear|bright|vibrant)\s+(?:display|screen)\b",
            r"\bdisplay\s+quality\s+is\s+good\b"
        ],
        "Camera & Media": [
            r"\b(?:great|good|clear)\s+(?:camera|picture\s+quality|photo\s+quality)\b"
        ],
        "Connectivity": [
            r"\b(?:bluetooth\s+connects?\s+easily|seamless\s+connection|fast\s+pairing|good\s+connectivity)\b",
            r"\bgood\s+integration\b"
        ]
    },
    "Fashion": {
        "Size & Fit": [
            r"\bfits?\s+(?:perfect|perfectlys?|great|well)\b",
            r"\b(?:great|good|perfect)\s+fit\b",
            r"\btrue\s+to\s+size\b"
        ],
        "Material & Fabric": [
            r"\b(?:good|soft|premium|comfortable)\s+(?:fabric|material)\b",
            r"\bgood\s+stitching\b"
        ],
        "Comfort": [
            r"\b(?:very\s+comfortable|comfortable|super\s+comfortable|easy\s+to\s+wear)\b"
        ]
    },
    "Beauty": {
        "Fragrance": [
            r"\b(?:smells?\s+(?:great|wonderful|good)|nice\s+smell|good\s+fragrance|pleasant\s+fragrance)\b"
        ],
        "Skin Feel": [
            r"\b(?:feels?\s+soft|gentle\s+on\s+skin|smooth\s+skin|glowing\s+skin)\b"
        ],
        "Effectiveness": [
            r"\b(?:effective|great\s+results|works\s+like\s+magic|visible\s+results)\b"
        ]
    },
    "Health & Personal Care": {
        "Effectiveness": [
            r"\b(?:very\s+effective|works\s+well|quick\s+relief|great\s+results)\b"
        ],
        "Comfort": [
            r"\b(?:comfortable\s+to\s+use|ergonomic|gentle)\b"
        ]
    },
    "Sports & Outdoors": {
        "Comfort": [
            r"\b(?:very\s+comfortable|comfortable|great\s+grip)\b"
        ],
        "Size & Fit": [
            r"\bfits?\s+well\b",
            r"\bgood\s+fit\b",
            r"\bperfect\s+size\b"
        ]
    },
    "Home & Kitchen": {
        "Capacity": [
            r"\b(?:good\s+capacity|spacious|holds\s+a\s+lot)\b"
        ]
    },
    "Tools & Appliances": {
        "Power": [
            r"\b(?:powerful\s+motor|strong\s+power|high\s+power)\b"
        ]
    },
    "Toys & Games": {
        "Fun": [
            r"\b(?:very\s+fun|kids\s+loved\s+it|entertaining|engaging)\b"
        ]
    }
}


# ==============================================================================
# MATCHING & NEGATION UTILITIES
# ==============================================================================

def is_negated_match(text: str, match_start: int) -> bool:
    """
    Checks if a negation token occurs within a 3-word window preceding match_start.
    """
    prefix = text[:match_start].lower()
    words = re.findall(r"\b\w+(?:'\w+)?\b", prefix)
    window = words[-3:] if len(words) >= 3 else words
    for w in window:
        if w in NEGATION_TOKENS or w.endswith("n't"):
            return True
    return False


def extract_complaints(
    review: str,
    product_category: Optional[str] = None,
    sentiment: Optional[str] = None
) -> List[str]:
    """
    Extracts complaint aspects from review text using product-category-aware taxonomy.
    """
    review_str = str(review).lower()
    found: Set[str] = set()

    active_map = dict(UNIVERSAL_COMPLAINTS)
    if product_category and product_category in CATEGORY_SPECIFIC_COMPLAINTS:
        for cat_name, patterns in CATEGORY_SPECIFIC_COMPLAINTS[product_category].items():
            if cat_name in active_map:
                active_map[cat_name] = active_map[cat_name] + patterns
            else:
                active_map[cat_name] = patterns

    for issue_cat, patterns in active_map.items():
        for pat in patterns:
            if re.search(pat, review_str, re.IGNORECASE):
                found.add(issue_cat)
                break

    return sorted(list(found))


def extract_positive_highlights(
    review: str,
    product_category: Optional[str] = None,
    sentiment: Optional[str] = None,
    use_sentiment_fallback: bool = True
) -> List[str]:
    """
    Extracts positive highlight aspects from review text using product-category-aware taxonomy,
    boundary-anchored regex matching, and rule-based negation guarding.
    """
    review_str = str(review).lower()
    found: Set[str] = set()

    active_map = dict(UNIVERSAL_HIGHLIGHTS)
    if product_category and product_category in CATEGORY_SPECIFIC_HIGHLIGHTS:
        for cat_name, patterns in CATEGORY_SPECIFIC_HIGHLIGHTS[product_category].items():
            if cat_name in active_map:
                active_map[cat_name] = active_map[cat_name] + patterns
            else:
                active_map[cat_name] = patterns

    for feature_cat, patterns in active_map.items():
        for pat in patterns:
            match = re.search(pat, review_str, re.IGNORECASE)
            if match:
                if not is_negated_match(review_str, match.start()):
                    found.add(feature_cat)
                    break

    # Conservative Sentiment-Aware Fallback:
    # If no specific aspect is detected, return "General Satisfaction" ONLY on POSITIVE reviews.
    # On NEGATIVE or NEUTRAL reviews, return [] (None).
    if len(found) == 0 and use_sentiment_fallback:
        if sentiment and str(sentiment).lower() == "positive":
            found.add("General Satisfaction")

    return sorted(list(found))

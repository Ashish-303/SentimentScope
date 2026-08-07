"""Advanced Text Preprocessing Pipeline for SentimentScope.

Provides modular, deterministic, and configurable cleaning operations including
Unicode normalization, URL/HTML removal, emoji translation, contraction expansion,
repeated character normalization, negation-preserving punctuation stripping,
tokenization, lemmatization, and custom stopword pruning.
"""

import re
import unicodedata
import logging
from typing import List, Dict, Set

# Ensure the backend directory is in the python path
import os
import sys
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import config

# Initialize Logger
logger = logging.getLogger("SentimentScope.Preprocessor")

# ==============================================================================
# CONTRACTIONS & EMOJIS DICTIONARIES
# ==============================================================================
CONTRACTIONS: Dict[str, str] = {
    "aint": "is not", "arent": "are not", "cant": "cannot", "cant've": "cannot have",
    "'cause": "because", "could've": "could have", "couldnt": "could not", "couldnt've": "could not have",
    "didnt": "did not", "doesnt": "does not", "dont": "do not", "hadnt": "had not",
    "hadnt've": "had not have", "hasnt": "has not", "havent": "have not", "hed": "he would",
    "hed've": "he would have", "hell": "he will", "hell've": "he will have", "hes": "he is",
    "howd": "how did", "howdy": "how do you", "howl": "how will", "hows": "how is",
    "id": "i would", "id've": "i would have", "ill": "i will", "ill've": "i will have",
    "im": "i am", "ive": "i have", "isnt": "is not", "itd": "it would", "itd've": "it would have",
    "itll": "it will", "itll've": "it will have", "its": "it is", "lets": "let us",
    "maam": "madam", "maynt": "may not", "might've": "might have", "mightnt": "might not",
    "mightnt've": "might not have", "must've": "must have", "mustnt": "must not",
    "mustnt've": "must not have", "neednt": "need not", "neednt've": "need not have",
    "o'clock": "of the clock", "oughtnt": "ought not", "oughtnt've": "ought not have",
    "sha'n't": "shall not", "shant": "shall not", "shant've": "shall not have",
    "shed": "she would", "shed've": "she would have", "shell": "she will", "shell've": "she will have",
    "shes": "she is", "should've": "should have", "shouldnt": "should not", "shouldnt've": "should not have",
    "so've": "so have", "sos": "so as", "this's": "this is", "thatd": "that would",
    "thatd've": "that would have", "thats": "that is", "thered": "there would", "thered've": "there would have",
    "theres": "there is", "theres'": "there is", "theyd": "they would", "theyd've": "they would have",
    "theyll": "they will", "theyll've": "they will have", "theyre": "they are", "theyve": "they have",
    "to've": "to have", "wasnt": "was not", "wed": "we would", "wed've": "we would have",
    "well": "we will", "well've": "we will have", "were": "we were", "werent": "were not",
    "weve": "we have", "whatll": "what will", "whatll've": "what will have", "whatre": "what are",
    "whats": "what is", "whatve": "what have", "whens": "when is", "whenve": "when have",
    "whered": "where did", "wheres": "where is", "whereve": "where have", "wholl": "who will",
    "wholl've": "who will have", "whos": "who is", "whove": "who have", "whys": "why is",
    "whyve": "why have", "will've": "will have", "wont": "will not", "wont've": "will not have",
    "would've": "would have", "wouldnt": "would not", "wouldnt've": "would not have",
    "yall": "you all", "yall'd": "you all would", "yall'd've": "you all would have",
    "yall're": "you all are", "yall've": "you all have", "youd": "you would", "youd've": "you would have",
    "youll": "you will", "youll've": "you will have", "youre": "you are", "youve": "you have"
}

EMOJI_MAP: Dict[str, str] = {
    "😊": " happy ", "🙂": " happy ", "😀": " happy ", "😁": " happy ", "😆": " happy ",
    "😍": " love ", "😘": " love ", "🥰": " love ", "👍": " good ", "👌": " perfect ",
    "👏": " praise ", "🙌": " praise ", "🎉": " celebrate ", "❤️": " love ", "💖": " love ",
    "😢": " sad ", "😭": " crying ", "😞": " disappointed ", "😔": " sad ", "💔": " broken ",
    "😡": " angry ", "😠": " angry ", "👎": " bad ", "💩": " terrible ", "🤮": " disgust ",
    "🤢": " disgust ", "💀": " dead ", "🔥": " awesome ", "✨": " excellent ", "⭐": " star "
}

NEGATIONS: Set[str] = {
    "not", "no", "never", "none", "neither", "nor", "cannot", "dont", "dont",
    "arent", "wasnt", "werent", "havent", "hasnt", "hadnt", "isnt", "didnt",
    "doesnt", "shouldnt", "wouldnt", "couldnt", "mustnt", "neednt", "shant",
    "ain", "aren", "couldn", "didn", "doesn", "hadn", "hasn", "haven", "isn",
    "mightn", "mustn", "needn", "shan", "shouldn", "wasn", "weren", "won", "wouldn"
}

# Add contractions with standard apostrophes
CONTRACTIONS.update({k.replace("'", ""): v for k, v in CONTRACTIONS.items() if "'" in k})
CONTRACTIONS.update({k.replace("'", "’"): v for k, v in CONTRACTIONS.items() if "'" in k})

# ==============================================================================
# COMPILED REGEX PATTERNS (Performance Tuning)
# ==============================================================================
HTML_RE: re.Pattern = re.compile(r'<[^>]+>')
URL_RE: re.Pattern = re.compile(r'https?://\S+|www\.\S+')
EMAIL_RE: re.Pattern = re.compile(r'\S+@\S+')
MENTION_RE: re.Pattern = re.compile(r'@\S+')
HASHTAG_RE: re.Pattern = re.compile(r'#(\w+)')
REPEATED_CHAR_RE: re.Pattern = re.compile(r'(.)\1{2,}')
PUNCTUATION_RE: re.Pattern = re.compile(r"[^\w\s']")  # Keeps apostrophe for contractions
WHITESPACE_RE: re.Pattern = re.compile(r'\s+')

# ==============================================================================
# NLTK ENGINE RESOLUTION
# ==============================================================================
_lemmatizer = None
_stopwords_set = None

try:
    import nltk
    from nltk.stem import WordNetLemmatizer
    from nltk.corpus import stopwords
    
    _lemmatizer = WordNetLemmatizer()
    _stopwords_set = set(stopwords.words(config.DEFAULT_LANGUAGE))
    if config.ENABLE_NEGATION_PRESERVATION:
        # Prevent negation removal from stopwords
        _stopwords_set = _stopwords_set - NEGATIONS
except Exception as e:
    logger.warning(f"Could not load NLTK WordNet / Stopwords: {e}. Falling back to default baseline processing.")

# ==============================================================================
# MODULAR PIPELINE CLEANING BLOCKS
# ==============================================================================

def expand_contractions(text: str) -> str:
    """Replaces English contractions with their expanded equivalents."""
    words = text.split()
    expanded_words = []
    for word in words:
        # Standardize apostrophes
        clean_word = word.replace("’", "'").replace("`", "'")
        # Check both direct match and lowercase match
        expanded = CONTRACTIONS.get(clean_word, CONTRACTIONS.get(clean_word.lower(), word))
        expanded_words.append(expanded)
    return " ".join(expanded_words)

def translate_emojis(text: str) -> str:
    """Translates common emojis into descriptive sentiment text words."""
    translated = []
    for char in text:
        translated.append(EMOJI_MAP.get(char, char))
    return "".join(translated)

def normalize_repeated_characters(text: str) -> str:
    """Normalizes repeated characters to at most two occurrences (e.g. loooove -> loove)."""
    return REPEATED_CHAR_RE.sub(r'\1\1', text)

def lemmatize_tokens(tokens: List[str]) -> List[str]:
    """Applies Lemmatization to clean tokens using NLTK WordNet, with a graceful fallback."""
    if not _lemmatizer:
        return tokens
    
    lemmatized = []
    for token in tokens:
        try:
            # Standardize nouns and verbs to base dictionary representation
            lemma = _lemmatizer.lemmatize(token, pos='v')
            lemma = _lemmatizer.lemmatize(lemma, pos='n')
            lemmatized.append(lemma)
        except Exception:
            lemmatized.append(token)
    return lemmatized

# ==============================================================================
# PIPELINE DRIVER
# ==============================================================================

def clean_text(text: str) -> str:
    """Applies the complete modular NLP cleaning pipeline in the finalized sequence.

    Args:
        text: Raw input review text string.

    Returns:
        Fully cleaned and normalized text string tokens joined by single spaces.
    """
    # 1. Error Handling & Validation
    if text is None:
        return ""
    
    text = str(text).strip()
    if text == "":
        return ""
    
    # 2. Unicode Normalization
    if config.ENABLE_UNICODE_NORMALIZATION:
        text = unicodedata.normalize('NFKD', text)
    
    # 3. HTML Removal
    if config.ENABLE_HTML_REMOVAL:
        text = HTML_RE.sub('', text)
        
    # 4. URL Replacement
    if config.ENABLE_URL_REPLACEMENT:
        text = URL_RE.sub(config.URL_REPLACEMENT_TOKEN, text)
        
    # 5. Email Replacement
    if config.ENABLE_EMAIL_REPLACEMENT:
        text = EMAIL_RE.sub(config.EMAIL_REPLACEMENT_TOKEN, text)
        
    # 6. Mention Replacement
    if config.ENABLE_MENTION_REPLACEMENT:
        text = MENTION_RE.sub(config.MENTION_REPLACEMENT_TOKEN, text)
        
    # 7. Hashtag Normalization
    if config.ENABLE_HASHTAG_NORMALIZATION:
        text = HASHTAG_RE.sub(r'\1', text)
        
    # 8. Emoji Translation
    if config.ENABLE_EMOJI_TRANSLATION:
        text = translate_emojis(text)
        
    # 9. Contraction Expansion
    if config.ENABLE_CONTRACTION_EXPANSION:
        text = expand_contractions(text)
        
    # 10. Lowercasing
    if config.ENABLE_LOWERCASE:
        text = text.lower()
        
    # 11. Repeated Character Normalization
    if config.ENABLE_REPEATED_CHAR_NORMALIZATION:
        text = normalize_repeated_characters(text)
        
    # 12. Punctuation Normalization
    if config.ENABLE_PUNCTUATION_NORMALIZATION:
        text = PUNCTUATION_RE.sub(' ', text)
        
    # 13. Tokenization & Number handling (Keep numbers as strings)
    tokens = text.split()
    
    # 14. Lemmatization
    if config.ENABLE_LEMMATIZATION:
        tokens = lemmatize_tokens(tokens)
        
    # 15. Stopword Removal
    if config.ENABLE_STOPWORD_REMOVAL and _stopwords_set is not None:
        tokens = [w for w in tokens if w not in _stopwords_set]
        
    # 16. Final Whitespace Cleanup
    cleaned_text = " ".join(tokens).strip()
    return cleaned_text


# ==============================================================================
# MANUAL VERIFICATION RUNNER
# ==============================================================================
if __name__ == "__main__":
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

    sample_texts = [
        "Check out this link: https://example.com and email me@domain.com!",
        "This product is not bad. I don't regret buying it, can't recommend it enough!!!",
        "Excellent build quality 😊, love the screen 😍. It is awesoome!!!",
        "Missing child-lock features <p>Paragraph tag</p> #QualityIssues",
        None,
        ""
    ]
    
    print("Executing Preprocessing Verification Run...")
    print("=" * 60)
    for sample in sample_texts:
        print(f"Original: {sample}")
        print(f"Cleaned : {clean_text(sample)}")
        print("-" * 60)
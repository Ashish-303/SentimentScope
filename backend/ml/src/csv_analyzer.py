import os
import pandas as pd

from predictor import analyze_review
from validators import validate_columns


def analyze_csv(csv_path):

    print(f"\nLoading CSV: {csv_path}")

    df = pd.read_csv(csv_path, encoding='utf-8')

    print(f"Original Shape: {df.shape}")

    (
        product_col,
        text_col,
        category_col,
        rating_col
    ) = validate_columns(df)

    print(
        f"Product Column Found: {product_col}"
    )

    print(
        f"Text Column Found: {text_col}"
    )

    print(
        f"Category Column Found: {category_col}"
    )

    print(
        f"Rating Column Found: {rating_col}"
    )

    # Remove rows with missing review text

    df = df.dropna(
        subset=[text_col]
    )

    print(
        f"After Removing Null Reviews: {df.shape}"
    )

    sentiments = []
    issues = []
    positive_features = []

    total_reviews = len(df)

    for index, review in enumerate(
        df[text_col],
        start=1
    ):

        try:

            review = str(review)

            result = analyze_review(
                review
            )

            sentiments.append(
                result["sentiment"]
            )

            issues.append(
                ", ".join(
                    result["issue"]
                )
            )

            positive_features.append(
                ", ".join(
                    result["positive_features"]
                )
            )

            if index % 100 == 0:

                print(
                    f"Processed {index}/{total_reviews}"
                )

        except Exception as e:

            print(
                f"Error at row {index}: {e}"
            )

            sentiments.append(
                "Unknown"
            )

            issues.append(
                "Other"
            )

            positive_features.append(
                "General Satisfaction"
            )

    # ==================================
    # STANDARDIZED COLUMNS
    # ==================================

    df["Product_Name"] = (
        df[product_col]
    )

    df["Review_Text"] = (
        df[text_col]
    )

    if category_col:
        df["Category"] = df[category_col]
    else:
        # Dynamically extract category from product names
        print("Category column missing. Extracting dynamically from product names...")
        def extract_category(product_name):
            name = str(product_name).lower()
            if any(x in name for x in ["cooler", "fan", "ac", "heater", "purifier", "water purifier", "kettle", "oven"]):
                return "Home & Kitchen"
            elif any(x in name for x in ["lipstick", "shampoo", "serum", "cream", "facial", "makeup", "soap", "hair"]):
                return "Beauty"
            elif any(x in name for x in ["speaker", "alexa", "headphones", "earbuds", "tv", "camera", "mobile", "router", "laptop"]):
                return "Electronics"
            elif any(x in name for x in ["sewing", "tool", "drill", "vacuum", "cleaner", "iron"]):
                return "Tools & Appliances"
            elif any(x in name for x in ["toy", "game", "lego", "board", "puzzle"]):
                return "Toys & Games"
            elif any(x in name for x in ["shirt", "jeans", "scarf", "wool", "dress", "shoes", "bag"]):
                return "Fashion"
            elif any(x in name for x in ["supplement", "multivitamin", "protein", "massager"]):
                return "Health & Personal Care"
            else:
                return "Sports & Outdoors"
        df["Category"] = df["Product_Name"].apply(extract_category)

    if rating_col:
        df["Rating"] = pd.to_numeric(df[rating_col], errors="coerce")

    # ==================================
    # MODEL OUTPUT
    # ==================================

    df["Predicted_Sentiment"] = (
        sentiments
    )

    df["Detected_Issues"] = (
        issues
    )

    df["Positive_Features"] = (
        positive_features
    )

    # ==================================
    # SUMMARY
    # ==================================

    print("\nAnalysis Summary")

    print(
        df["Predicted_Sentiment"]
        .value_counts()
    )

    print("\nPositive Features:")

    print(
        df["Positive_Features"]
        .value_counts()
        .head(10)
    )

    print(
        f"\nProducts Found: "
        f"{df['Product_Name'].nunique()}"
    )

    return df


# ==================================
# TEST
# ==================================

if __name__ == "__main__":

    BASE_DIR = os.path.dirname(
        os.path.abspath(__file__)
    )

    CSV_PATH = os.path.join(
        BASE_DIR,
        "..",
        "data",
        "sample_reviews.csv"
    )

    result_df = analyze_csv(
        CSV_PATH
    )

    print("\nAnalysis Complete")

    print(
        result_df.head()
    )

    OUTPUT_PATH = os.path.join(
        BASE_DIR,
        "..",
        "data",
        "analyzed_reviews.csv"
    )

    result_df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print(
        f"\nSaved Output To:\n{OUTPUT_PATH}"
    )
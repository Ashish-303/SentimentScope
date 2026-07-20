import os
import pandas as pd


def generate_dashboard(df):

    dashboard = {}

    # ==================================
    # KPI CARDS
    # ==================================

    dashboard["total_reviews"] = len(df)

    dashboard["total_products"] = (
        int(df["Product_Name"].nunique())
        if "Product_Name" in df.columns
        else 0
    )

    dashboard["positive_reviews"] = int(
        (df["Predicted_Sentiment"] == "Positive").sum()
    )

    dashboard["neutral_reviews"] = int(
        (df["Predicted_Sentiment"] == "Neutral").sum()
    )

    dashboard["negative_reviews"] = int(
        (df["Predicted_Sentiment"] == "Negative").sum()
    )

    # ==================================
    # SENTIMENT SUMMARY
    # ==================================

    dashboard["sentiment_summary"] = {
        str(k): int(v)
        for k, v in df["Predicted_Sentiment"]
        .value_counts()
        .items()
    }

    # ==================================
    # ISSUE SUMMARY
    # ==================================

    issue_counts = {}

    if "Detected_Issues" in df.columns:

        for issues in df["Detected_Issues"]:

            for issue in str(issues).split(","):

                issue = issue.strip()

                if issue in ["", "Other"]:
                    continue

                issue_counts[issue] = (
                    issue_counts.get(issue, 0) + 1
                )

    dashboard["issue_summary"] = issue_counts

    # ==================================
    # POSITIVE FEATURES SUMMARY
    # ==================================

    positive_feature_counts = {}

    if "Positive_Features" in df.columns:

        for features in df["Positive_Features"]:

            for feature in str(features).split(","):

                feature = feature.strip()

                if feature in [
                    "",
                    "General Satisfaction"
                ]:
                    continue

                positive_feature_counts[feature] = (
                    positive_feature_counts.get(feature, 0) + 1
                )

    dashboard["positive_features_summary"] = (
        positive_feature_counts
    )

    # ==================================
    # CATEGORY SUMMARY
    # ==================================

    if "Category" in df.columns:

        dashboard["category_summary"] = {
            str(k): int(v)
            for k, v in df["Category"]
            .value_counts()
            .head(10)
            .items()
        }

    else:

        dashboard["category_summary"] = {}

    # ==================================
    # TOP PRODUCTS
    # ==================================

    if (
        "Product_Name" in df.columns
        and "Rating" in df.columns
    ):

        top_products = (
            df.groupby("Product_Name")["Rating"]
            .mean()
            .sort_values(ascending=False)
            .head(10)
        )

        dashboard["top_products"] = {
            str(k): float(v)
            for k, v in top_products.round(2).items()
        }

    else:

        dashboard["top_products"] = {}

    # ==================================
    # PRODUCT SENTIMENT BREAKDOWN
    # ==================================

    product_sentiment = {}

    if (
        "Product_Name" in df.columns
        and "Predicted_Sentiment" in df.columns
    ):

        sentiment_table = pd.crosstab(
            df["Product_Name"],
            df["Predicted_Sentiment"]
        )

        product_sentiment = {
            str(product): {
                str(sentiment): int(count)
                for sentiment, count in values.items()
            }
            for product, values in sentiment_table.head(10)
            .to_dict(orient="index")
            .items()
        }

    dashboard["product_sentiment_breakdown"] = (
        product_sentiment
    )

    # ==================================
    # RECENT NEGATIVE REVIEWS
    # ==================================

    negative_reviews = []

    if (
        "Review_Text" in df.columns
        and "Predicted_Sentiment" in df.columns
    ):

        negative_df = df[
            df["Predicted_Sentiment"] == "Negative"
        ].head(5)

        for _, row in negative_df.iterrows():

            negative_reviews.append({

                "product": row.get(
                    "Product_Name",
                    "Unknown Product"
                ),

                "review": row.get(
                    "Review_Text",
                    ""
                ),

                "issue": row.get(
                    "Detected_Issues",
                    "Other"
                )

            })

    dashboard["recent_negative_reviews"] = (
        negative_reviews
    )

    return dashboard


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
        "dataset",
        "analyzed_reviews.csv"
    )

    df = pd.read_csv(CSV_PATH)

    dashboard = generate_dashboard(df)

    print("\nDashboard Generated\n")

    from pprint import pprint
    pprint(dashboard)
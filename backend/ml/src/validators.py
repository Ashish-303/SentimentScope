def validate_columns(df):

    # ===============================
    # REVIEW TEXT COLUMN
    # ===============================

    text_columns = [
        "review_text",
        "reviewText",
        "Summary",
        "summary",
        "Review Content",
        "review",
        "review_content",
        "text"
    ]

    # ===============================
    # PRODUCT COLUMN
    # ===============================

    product_columns = [
        "product_title",
        "product_name",
        "product",
        "Product Name",
        "title"
    ]

    # ===============================
    # CATEGORY COLUMN
    # ===============================

    category_columns = [
        "category",
        "Category",
        "product_category"
    ]

    # ===============================
    # RATING COLUMN
    # ===============================

    rating_columns = [
        "rating",
        "Rate",
        "rate",
        "overall",
        "Review Rating",
        "score"
    ]

    found_text = None
    found_product = None
    found_category = None
    found_rating = None

    # Find review column
    for col in text_columns:

        if col in df.columns:

            found_text = col
            break

    # Find product column
    for col in product_columns:

        if col in df.columns:

            found_product = col
            break

    # Find category column
    for col in category_columns:

        if col in df.columns:

            found_category = col
            break

    # Find rating column
    for col in rating_columns:

        if col in df.columns:

            found_rating = col
            break

    # ===============================
    # REQUIRED VALIDATION
    # ===============================

    if found_product is None:

        raise ValueError(
            "CSV must contain a product_title column"
        )

    if found_text is None:

        raise ValueError(
            "CSV must contain a review_text column"
        )

    return (
        found_product,
        found_text,
        found_category,
        found_rating
    )
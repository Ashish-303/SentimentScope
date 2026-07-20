def detect_positive_features(review):

    review = str(review).lower()

    categories = {

        "Quality": [
            "excellent quality",
            "great quality",
            "high quality",
            "premium quality",
            "well made",
            "good quality",
            "top notch",
            "highly recommend",
            "great product",
            "excellent product"
        ],

        "Performance": [
            "works perfectly",
            "great performance",
            "performance",
             "works fast",
            "runs fast",
            "fast performance",
            "smooth",
            "responsive",
            "smooth",
            "responsive",
            "efficient",
            "works great",
            "works flawlessly"
        ],

        "Features": [
            "great features",
            "useful feature",
            "feature rich",
            "lots of features",
            "excellent features",
            "exactly what i needed"
        ],

        "Packaging": [
            "well packaged",
            "beautiful packaging",
            "good packaging",
            "nicely packed",
            "great packaging"
        ],

        "Delivery": [
            "fast delivery",
            "quick delivery",
            "arrived on time",
            "delivered quickly",
            "fast shipping"
        ],

        "Value for Money": [
            "worth the price",
            "value for money",
            "great value",
            "good value",
            "worth every penny",
            "well worth the price"
        ],

        "Design": [
            "beautiful design",
            "stylish",
            "looks great",
            "attractive",
            "nice design"
        ],

        "Ease of Use": [
            "easy to use",
            "user friendly",
            "simple to use",
            "easy setup"
        ],

        "Durability": [
            "durable",
            "long lasting",
            "sturdy",
            "solid build"
        ]
    }

    found_features = []

    for feature, keywords in categories.items():

        for keyword in keywords:

            if keyword in review:

                found_features.append(
                    feature
                )

                break

    if len(found_features) == 0:

        found_features.append(
            "General Satisfaction"
        )

    return found_features


if __name__ == "__main__":

    reviews = [

        "Excellent quality and works perfectly",

        "Worth every penny. Great value.",

        "Fast delivery and beautiful packaging",

        "Easy to use and durable",

        "Stylish design and great features",

        "Highly recommend. Excellent product.",

        "Top-notch build and performance.",

        "Exactly what I needed.",

        "Great product! Works flawlessly.",

        "Fast shipping and great packaging."
    ]

    for review in reviews:

        print(review)

        print(
            detect_positive_features(
                review
            )
        )

        print("-" * 50)
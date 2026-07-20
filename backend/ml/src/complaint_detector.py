def detect_issue(review):

    review = str(review).lower()

    categories = {

        "Delivery": [
            "delivery",
            "shipping",
            "courier",
            "late",
            "delay",
            "arrived late",
            "delayed"
        ],

        "Packaging": [
            "package",
            "packaging",
            "box",
            "sealed",
            "damaged package",
            "poor packaging"
        ],

        "Quality": [
            "broken",
            "defective",
            "faulty",
            "damaged",
            "poor quality",
            "bad quality",
            "cheap quality",
            "worst quality",
            "low quality",
            "stopped working",
            "not working",
            "doesn't work",
            "does not work",
            "broke",
            "cracked"
        ],

        "Performance": [
            "slow",
            "lag",
            "lagging",
            "freezing",
            "performance",
            "speed",
            "sluggish"
        ],

        "Battery": [
            "battery",
            "charging",
            "charge",
            "drains fast",
            "battery life",
            "overheating"
        ],

        "Compatibility": [
            "compatible",
            "compatibility",
            "connect",
            "connection",
            "bluetooth",
            "pairing",
            "sync",
            "supported"
        ],

        "Service": [
            "customer support",
            "support",
            "refund",
            "seller",
            "service",
            "replacement",
            "help desk"
        ],

        "Pricing": [
            "expensive",
            "overpriced",
            "too costly",
            "not worth the price",
            "high price",
            "cost"
        ],

        "Features": [
            "feature",
            "function",
            "option",
            "missing feature",
            "missing functionality"
        ],

        "Disappointment": [
        "disappointed",
        "terrible",
        "worst purchase",
        "do not buy",
        "bad experience",
        "waste of money",
        "not worth it"
       ],

        "Durability": [
        "wear out",
        "lasted",
        "durable",
        "durability",
        "fell apart"
        ],

        "Size & Fit": [
        "too small",
        "too large",
        "fit",
        "fitting",
        "size issue"
        ],

        "Content": [
        "boring",
        "poor writing",
        "confusing",
        "bad story",
        "bad content"
        ],

        "Accuracy": [
        "incorrect",
        "wrong",
        "inaccurate"
       ]



    }

    found_issues = []

    for issue, keywords in categories.items():

        for keyword in keywords:

            if keyword in review:

                found_issues.append(issue)
                break

    return found_issues


if __name__ == "__main__":

    reviews = [

        "Delivery was delayed by 5 days",

        "The product stopped working after 2 days",

        "The package arrived damaged",

        "Customer support never replied",

        "Battery drains fast and charging is slow",

        "Bluetooth pairing does not work",

        "The product is too expensive for the features offered",

        "Delivery was delayed and the product arrived broken"
        "Very disappointed with this item",
        "I regret buying this product",
        "Not satisfied with the quality",
        "The package arrived damaged and I am disappointed"
    ]

    for review in reviews:

        print(review)

        print(detect_issue(review))

        print("-" * 60)




   

   

    

   
    
import pandas as pd

def load_data(path):
    return pd.read_csv(path, encoding='utf-8')

def clean_data(df):

    df = df.dropna(subset=['review_text', 'sentiment'])

    df = df.drop_duplicates()

    return df

if __name__ == "__main__":

    df = load_data("../data/balanced_reviews.csv")

    print("Before:", df.shape)

    df = clean_data(df)

    print("After:", df.shape)

    print(df.columns)
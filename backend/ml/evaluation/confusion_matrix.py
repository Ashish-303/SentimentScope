"""Confusion Matrix Computation and Formatter.

Generates confusion matrices for multi-class classifiers on validation subsets
and outputs formatted structures for plotting and LaTeX table exporting.
"""

from typing import Any, List

def compute_raw_confusion_matrix(
    y_true: Any,
    y_pred: Any,
    labels: List[str]
) -> List[List[int]]:
    """Calculates confusion matrix array.

    Args:
        y_true: Ground truth sentiment labels.
        y_pred: Predicted class labels.
        labels: Class label names in order (Negative, Neutral, Positive).

    Returns:
        A nested list representing the counts matrix.
    """
    # ==========================================
    # TODO
    # ==========================================
    # TODO: Compute confusion matrix via sklearn.metrics
    # TODO: Format as nested list
    pass

if __name__ == "__main__":
    # TODO: Perform verification test run
    pass

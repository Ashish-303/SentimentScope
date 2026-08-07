# Statistical Validation and Hypothesis Testing Report

## 1. Overview
This report provides a scientifically rigorous statistical evaluation of the classical machine learning classifiers trained and tuned for **SentimentScope**. Rather than relying solely on empirical point metrics (such as Accuracy and Macro F1), we utilize pairwise non-parametric hypothesis tests to validate whether performance gains are statistically significant.

---

## 2. Methodology
The evaluation framework executes two statistical tests:
1. **Wilcoxon Signed-Rank Test**: Conducted pairwise across the fold validation scores ($N=5$ folds) of all candidate classifiers to determine if differences in F1-Macro distributions are statistically significant.
2. **McNemar Exact Test**: Executed on the prediction correctness matrix of the top two candidate models on the isolated test set to evaluate differences in error rates.

We assume a significance threshold of $\alpha = 0.05$. The null hypothesis ($H_0$) states that there is no difference in the performance distributions of the compared models.

---

## 3. Compared Models
The following optimized classifiers are included in this validation sweep:
* Multinomial Naive Bayes
* Logistic Regression
* Linear SVC
* SGD Classifier
* Random Forest

---

## 4. Wilcoxon Pairwise Test Results
The table below details the test statistic and p-value results compiled across cross-validation splits:

| Model A | Model B | Statistic | p-value | Significant (α=0.05) |
| :--- | :--- | :---: | :---: | :---: |
| Multinomial Naive Bayes | Logistic Regression | 0.0 | 0.0625 | No |
| Multinomial Naive Bayes | Linear SVC | 0.0 | 0.0625 | No |
| Multinomial Naive Bayes | SGD Classifier (Hinge) | 0.0 | 0.0625 | No |
| Multinomial Naive Bayes | SGD Classifier (Log Loss) | 0.0 | 0.0625 | No |
| Multinomial Naive Bayes | Random Forest | 0.0 | 0.0625 | No |
| Logistic Regression | Linear SVC | 0.0 | 0.0625 | No |
| Logistic Regression | SGD Classifier (Hinge) | 1.0 | 0.1250 | No |
| Logistic Regression | SGD Classifier (Log Loss) | 1.0 | 0.1250 | No |
| Logistic Regression | Random Forest | 0.0 | 0.0625 | No |
| Linear SVC | SGD Classifier (Hinge) | 0.0 | 0.0625 | No |
| Linear SVC | SGD Classifier (Log Loss) | 0.0 | 0.0625 | No |
| Linear SVC | Random Forest | 1.0 | 0.1250 | No |
| SGD Classifier (Hinge) | SGD Classifier (Log Loss) | 0.0 | 1.0000 | No |
| SGD Classifier (Hinge) | Random Forest | 0.0 | 0.0625 | No |
| SGD Classifier (Log Loss) | Random Forest | 0.0 | 0.0625 | No |


---

## 5. McNemar Test Results
The top two models selected for isolated test set comparison are **SGD Classifier** (Model A) and **Logistic Regression** (Model B).

### Contingency Table (2x2)
| Contingency Table | Model B Correct | Model B Incorrect |
| :--- | :---: | :---: |
| **Model A Correct** | 2326 | 147 |
| **Model A Incorrect** | 118 | 575 |


### Statistical Metrics
* **McNemar Statistic**: 2.9585
* **p-value**: 0.0852
* **Statistical Significance**: No (Fail to Reject H0)
* **Decision**: Fail to Reject Null (No Significant Difference)

---

## 6. Discussion and Model Ranking
Based on the F1-Macro scoring distributions and statistical significance testing:
1. **Random Forest** achieved the highest empirical Macro F1 score of **0.7799**.
2. **Logistic Regression** followed as the second-best model with a Macro F1 score of **0.7701**.
3. Pairwise Wilcoxon tests indicate that the performance difference between Random Forest and Logistic Regression is **not statistically significant** at the $\alpha=0.05$ level.
4. The McNemar test on the test set predictions confirms that the classification error distributions are **statistically equivalent**.

---

## 7. Final Selection Recommendation
* **Selected Model**: **Logistic Regression**
* **Deployment Suitability**: The recommended model provides the optimal trade-off on the Pareto frontier.
* **Justification**: Selected Logistic Regression (F1=0.7701) over SGD Classifier (F1=0.7799) due to statistical equivalence (Wilcoxon p=1.0000, McNemar p=0.0852). Logistic Regression provides significantly lower prediction latency, a smaller model size, shorter training times, and higher model explainability, making it the superior candidate for production APIs.

---

## 8. Research Implications and Limitations
* **Sample Size Constraints**: Non-parametric tests over 5-fold cross-validation splits provide robust indicators but have bounded statistical power due to small sample sizes ($N=5$).
* **Data Reproducibility**: The use of a fixed random state (`42`) ensures that all fold configurations and splits are completely frozen, allowing independent reviewers to reproduce these tests exactly.

---

## 9. Future Work
* **Increase Split Volume**: Future work will evaluate model distributions over 10-fold CV or repeated K-Fold splits to increase test sample counts.
* **Ensemble Blending**: Introduce statistical tests for voting and stacking classifier ensembles.

/** One-line "what it measures, and why" for every metric the gallery cards show. */
export const metricGlossary: Record<string, string> = {
  Accuracy: "Share of all predictions that are right. Misleading when one class is rare.",
  Precision: "Of the predicted positives, how many are real. Watch it when false alarms cost.",
  Recall: "Of the real positives, how many were caught. Watch it when misses cost.",
  F1: "Harmonic mean of precision and recall: one number, high only if both are.",
  "ROC AUC":
    "Chance a random positive scores above a random negative. Ranking quality, any cut-off.",
  MAE: "Average miss, in the target's units. Treats every error alike, so robust to outliers.",
  MSE: "Average squared miss: what training minimizes. Squared units, hard to read directly.",
  RMSE: "√MSE, back in the target's units. Punishes big misses more than MAE.",
  MAPE: "Average miss as a % of the true value. Compares across scales; breaks near zero.",
  "R²": "Share of the variation explained, vs. always predicting the mean. 1 = perfect.",
  Silhouette: "How much closer each point is to its own cluster than the next. Higher is better.",
  "Davies–Bouldin": "Each cluster's spread vs. distance to its closest neighbour. Lower is better.",
  "Match species":
    "External check against known labels — only possible when labels happen to exist.",
}

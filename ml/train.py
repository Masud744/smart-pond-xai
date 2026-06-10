"""
Smart Pond XAI — Fish Habitat Suitability Model Training
=========================================================
Dataset  : Real fish habitat data (287 unique samples, 11 fish species)
Strategy : Gaussian noise augmentation (50x) → 14,350 training samples
Features : pH, Temperature, Turbidity
Target   : Fish species recommendation
Models   : Random Forest, Decision Tree, SVM
"""

import os, sys
import numpy as np
import pandas as pd
import joblib
import warnings
warnings.filterwarnings("ignore")

from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score,
    recall_score, classification_report, confusion_matrix
)

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR  = os.path.join(BASE_DIR, "data", "raw")
PROC_DIR  = os.path.join(BASE_DIR, "data", "processed")
MODEL_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(DATA_DIR,  exist_ok=True)
os.makedirs(PROC_DIR,  exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

DATASET_PATH = os.path.join(DATA_DIR, "pond_dataset.csv")
FEATURES     = ["ph", "temperature", "turbidity"]
AUGMENT_X    = 50   # 50x augmentation

print("=" * 62)
print("  Smart Pond XAI — Fish Habitat Training Pipeline")
print("=" * 62)

# ── STEP 1: Load ──
print("\n[1/7] Loading dataset...")
if not os.path.exists(DATASET_PATH):
    print(f"  ERROR: Dataset not found → {DATASET_PATH}")
    sys.exit(1)

df_raw = pd.read_csv(DATASET_PATH)
print(f"  Raw rows: {len(df_raw):,}")

df = df_raw.drop_duplicates().dropna()
print(f"  Unique rows after dedup: {len(df)}")
print(f"  Fish species ({df['fish'].nunique()}):")
for fish, cnt in df['fish'].value_counts().items():
    print(f"    {fish:<12}: {cnt:>4} unique samples")

# ── STEP 2: Augmentation ──
print(f"\n[2/7] Data Augmentation ({AUGMENT_X}x Gaussian noise)...")
np.random.seed(42)
rows = []
for _, row in df.iterrows():
    rows.append(row.to_dict())
    for _ in range(AUGMENT_X - 1):
        rows.append({
            "ph"         : round(float(np.clip(row["ph"]          + np.random.normal(0, 0.05), 0, 14)),   2),
            "temperature": round(float(np.clip(row["temperature"] + np.random.normal(0, 0.30), 0, 50)),   2),
            "turbidity"  : round(float(np.clip(row["turbidity"]   + np.random.normal(0, 0.20), 0, 100)),  2),
            "fish"       : row["fish"]
        })

df_aug = pd.DataFrame(rows)
print(f"  Augmented dataset: {len(df_aug):,} samples")
print(f"  Distribution:")
for fish, cnt in df_aug["fish"].value_counts().items():
    print(f"    {fish:<12}: {cnt:>6,}")

# Save augmented dataset
df_aug.to_csv(os.path.join(PROC_DIR, "cleaned_data.csv"), index=False)
print(f"  Saved → {PROC_DIR}/cleaned_data.csv")

# ── STEP 3: Preprocessing ──
print("\n[3/7] Preprocessing...")
X   = df_aug[FEATURES].values
le  = LabelEncoder()
y   = le.fit_transform(df_aug["fish"].values)
print(f"  Classes: {list(le.classes_)}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
scaler      = StandardScaler()
X_train_sc  = scaler.fit_transform(X_train)
X_test_sc   = scaler.transform(X_test)

joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
joblib.dump(le,     os.path.join(MODEL_DIR, "label_encoder.pkl"))
print(f"  Train: {len(X_train):,} | Test: {len(X_test):,}")
print(f"  Scaler + LabelEncoder saved")

# ── STEP 4: Train Models ──
print("\n[4/7] Training models...")
models_def = {
    "Random Forest": RandomForestClassifier(
        n_estimators=300, max_depth=15, random_state=42, n_jobs=-1),
    "Decision Tree": DecisionTreeClassifier(
        max_depth=15, random_state=42),
    "SVM":           SVC(
        kernel="rbf", probability=True, random_state=42),
}
results = {}
for name, model in models_def.items():
    print(f"  {name}...", end=" ", flush=True)
    model.fit(X_train_sc, y_train)
    pred = model.predict(X_test_sc)
    results[name] = {
        "model":     model,
        "pred":      pred,
        "accuracy":  accuracy_score(y_test, pred),
        "precision": precision_score(y_test, pred, average="weighted", zero_division=0),
        "recall":    recall_score(y_test, pred, average="weighted"),
        "f1":        f1_score(y_test, pred, average="weighted"),
    }
    print(f"Accuracy: {results[name]['accuracy']*100:.2f}%")

# ── STEP 5: Compare ──
print("\n[5/7] Model Comparison:")
print(f"  {'Model':<20} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}")
print(f"  {'-'*64}")
best_name = max(results, key=lambda k: results[k]["f1"])
for name, r in results.items():
    marker = " ← BEST" if name == best_name else ""
    print(f"  {name:<20} {r['accuracy']:>10.4f} {r['precision']:>10.4f} {r['recall']:>10.4f} {r['f1']:>10.4f}{marker}")

# ── STEP 6: Detailed RF Report ──
print(f"\n[6/7] Detailed Report — Random Forest:")
print(classification_report(
    y_test, results["Random Forest"]["pred"],
    target_names=le.classes_
))
print("  Confusion Matrix:")
print(confusion_matrix(y_test, results["Random Forest"]["pred"]))

# ── STEP 7: Save + Feature Importance ──
print("\n[7/7] Saving models + feature importance...")
joblib.dump(results["Random Forest"]["model"], os.path.join(MODEL_DIR, "rf_model.pkl"))
joblib.dump(results["Decision Tree"]["model"], os.path.join(MODEL_DIR, "dt_model.pkl"))
joblib.dump(results["SVM"]["model"],           os.path.join(MODEL_DIR, "svm_model.pkl"))
# xgboost_model.pkl slot — RF copy for API compatibility
joblib.dump(results["Random Forest"]["model"], os.path.join(MODEL_DIR, "xgboost_model.pkl"))
print("  All models saved ✓")

rf_model    = results["Random Forest"]["model"]
importances = rf_model.feature_importances_
print("\n  Feature Importance (Random Forest):")
for feat, imp in sorted(zip(FEATURES, importances), key=lambda x: x[1], reverse=True):
    bar = "█" * int(imp * 50)
    print(f"  {feat:<15} {imp:.4f}  {bar}")

pd.DataFrame({"feature": FEATURES, "importance": importances}).sort_values(
    "importance", ascending=False
).to_csv(os.path.join(MODEL_DIR, "feature_importance.csv"), index=False)

# ── Quick Test ──
print("\n  Quick Prediction Test:")
tests = [(7.2, 28, 5.0), (8.5, 30, 3.5), (6.5, 25, 7.0), (7.1, 25, 7.5)]
for ph, temp, turb in tests:
    feat     = scaler.transform([[ph, temp, turb]])
    idx      = rf_model.predict(feat)[0]
    proba    = rf_model.predict_proba(feat)[0]
    top3     = np.argsort(proba)[::-1][:3]
    top3_str = "  ".join([f"{le.classes_[i]}({proba[i]*100:.0f}%)" for i in top3])
    print(f"  pH={ph}, T={temp}°C, Turb={turb} → {le.classes_[idx]}({proba[idx]*100:.1f}%) | {top3_str}")

print("\n" + "=" * 62)
print(f"  Training Complete!")
print(f"  Best: Random Forest — {results['Random Forest']['accuracy']*100:.2f}% accuracy")
print(f"  Models: {MODEL_DIR}")
print("=" * 62)
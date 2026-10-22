# Triage Acuity Prediction Model

This folder contains the trained machine learning model used to predict patient acuity level (1–5) at the point of triage, for integration into the main hospital system via a RESTful API.

## Model Summary

- **Algorithm:** XGBoost Classifier, trained on SMOTE-balanced data
- **Training data:** MIMIC-IV-ED dataset (418,083 cleaned emergency department records)
- **Target output:** Acuity level, 1 (most severe) to 5 (least severe)
- **Model file:** `triage_model.pkl` (saved using `joblib`)

## Required Input Fields (from the triage intake form)

The model expects **14 raw fields**, collected at the point of patient intake:

| Field | Type | Notes |
|---|---|---|
| `temperature` | float | Degrees Fahrenheit |
| `heartrate` | float | Beats per minute |
| `resprate` | float | Breaths per minute |
| `o2sat` | float | Oxygen saturation (%) |
| `sbp` | float | Systolic blood pressure (mmHg) |
| `dbp` | float | Diastolic blood pressure (mmHg) |
| `pain` | float or null | Pain score, 0–10. Send `null` if the patient cannot report pain (e.g. unconscious, nonverbal) |
| `gender` | string | `"M"` or `"F"` |
| `arrival_transport` | string | One of: `"AMBULANCE"`, `"WALK IN"`, `"HELICOPTER"`, `"OTHER"`, `"UNKNOWN"` |
| `arrival_time` | ISO datetime string | Used to derive hour of day and day of week |

> **Note:** Any field that cannot be collected (e.g. a patient arrives unconscious and vitals are only partially obtained) should be sent as `null` rather than omitted. The API applies the same missing-value handling used during model training, and this missingness is itself treated as a meaningful signal by the model — do not attempt to guess or default a value on the frontend.

## How the API Should Process a Request

The 14 raw fields above are **not** sent directly to the model. Before calling `model.predict()`, the API layer must reconstruct the full 38-feature set the model was trained on. This involves:

1. **Validating vitals against clinical bounds** (e.g. heart rate 20–250, O2 sat 50–100) — values outside these ranges should be treated as missing, not passed through as-is.
2. **Deriving the shock index**: `heartrate / sbp`
3. **Deriving time-based features** from `arrival_time`: hour of day, day of week, weekend flag, night-shift flag (00:00–06:00)
4. **Populating the six aggregate vital fields** (`hr_mean`, `hr_max`, `resprate_max`, `o2sat_min`, `sbp_min`, `temp_max`) using the single intake reading for each, since only one reading exists at the point of triage. *(Design note: the model was trained on vitals aggregated across a full ED stay. At initial triage, only one reading is available — consistent with real clinical practice, where triage decisions are made on the first available reading rather than a complete stay history. These fields therefore default to that first reading and may be updated with true aggregates if the system is later extended to re-score patients as more vitals are recorded during their stay.)*
5. **Imputing any missing numeric fields** using the training-set median values (provided separately in `medians.json`), and setting the corresponding `*_was_missing` flag to 1 for any field that was null.
6. **Encoding categoricals**: `gender` → 0/1, `arrival_transport` → one-hot columns matching training (`transport_AMBULANCE`, `transport_WALK IN`, etc.)

## Output

The model returns an integer from 1–5 representing the predicted acuity level. The API should map this to the interface's existing colour-coded triage tags:

| Acuity Level | Colour |
|---|---|
| 1 | Red |
| 2 | Orange |
| 3 | Yellow |
| 4 | Green |
| 5 | Blue |

## Loading the Model

```python
import joblib
model = joblib.load("triage_model.pkl")
prediction = model.predict(feature_array)  # feature_array must match the 38-feature training order
```

The exact column order expected by the model is provided in `feature_columns.json`.

## Known Limitations

- The model was trained on a US hospital dataset (MIMIC-IV-ED) and has not yet been validated against Nigerian patient data.
- Prediction accuracy is strongest for Acuity Level 3 (majority class); performance on the rarest levels (4 and 5) is lower, consistent with their rarity in the training data. The system is designed to support, not replace, clinical judgement — all predictions should remain overridable by nursing and physician staff.

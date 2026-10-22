"""
predictor.py
Turns the raw triage intake fields into the 38 features the model was trained on,
calls the model, and returns an acuity level (1-5).

This file mirrors the preprocessing done in the training notebook:
  - vitals outside clinical bounds are treated as missing
  - shock_index = heartrate / sbp
  - time features derived from arrival time
  - missing numeric values -> training-set median + a *_was_missing flag (1)
  - aggregate vitals (hr_mean, hr_max, ...) use the single intake reading
  - gender -> 0/1, arrival_transport -> one-hot
"""

import json
import math
import os
from datetime import datetime, timedelta, timezone

import joblib
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Nigeria (WAT) is UTC+1 with no daylight saving. Override with an env var if needed.
HOSPITAL_UTC_OFFSET_HOURS = float(os.environ.get("HOSPITAL_UTC_OFFSET_HOURS", "1"))

# Same clinical bounds used when cleaning the training data
VITAL_BOUNDS = {
    "temperature": (80, 110),   # deg F
    "heartrate": (20, 250),     # bpm
    "resprate": (4, 60),        # breaths/min
    "o2sat": (50, 100),         # %
    "sbp": (40, 260),           # mmHg
    "dbp": (20, 150),           # mmHg
}
PAIN_BOUNDS = (0, 10)

TRANSPORT_OPTIONS = ["AMBULANCE", "HELICOPTER", "OTHER", "UNKNOWN", "WALK IN"]

TRIAGE_COLOURS = {1: "Red", 2: "Orange", 3: "Yellow", 4: "Green", 5: "Blue"}

# If fewer than this many of the 6 core vitals were usable, the result is still
# returned but flagged so staff assess the patient manually.
MIN_VITALS_FOR_AUTO_TRIAGE = 3

NUMERIC_COLS = [
    "temperature", "heartrate", "resprate", "o2sat", "sbp", "dbp",
    "shock_index", "pain_numeric",
    "hr_mean", "hr_max", "resprate_max", "o2sat_min", "sbp_min", "temp_max",
]


class ValidationError(Exception):
    def __init__(self, details):
        super().__init__("; ".join(details))
        self.details = details


def _to_number(value, field, errors):
    """None -> None. Numbers / numeric strings -> float. Anything else -> error."""
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        errors.append(f"'{field}' must be a number or null")
        return None
    try:
        num = float(value)
    except (TypeError, ValueError):
        errors.append(f"'{field}' must be a number or null")
        return None
    if math.isnan(num) or math.isinf(num):
        return None
    return num


def _parse_arrival_time(value, errors):
    """Return a naive datetime in hospital local time. Defaults to 'now'."""
    local_tz = timezone(timedelta(hours=HOSPITAL_UTC_OFFSET_HOURS))
    if value in (None, ""):
        return datetime.now(local_tz).replace(tzinfo=None)
    try:
        dt = datetime.fromisoformat(str(value).strip().replace("Z", "+00:00"))
    except ValueError:
        errors.append("'arrival_time' must be an ISO datetime, e.g. 2026-10-21T14:30:00")
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(local_tz).replace(tzinfo=None)
    return dt


class TriagePredictor:
    def __init__(self, model=None, feature_columns=None, medians=None):
        if model is None:
            model = joblib.load(os.path.join(BASE_DIR, "triage_model.pkl"))
        if feature_columns is None:
            with open(os.path.join(BASE_DIR, "feature_columns.json")) as f:
                feature_columns = json.load(f)
        if medians is None:
            with open(os.path.join(BASE_DIR, "medians.json")) as f:
                medians = json.load(f)

        missing_medians = [c for c in NUMERIC_COLS if c not in medians]
        if missing_medians:
            raise ValueError(f"medians.json is missing: {missing_medians}")

        self.model = model
        self.feature_columns = feature_columns
        self.medians = medians

    # ------------------------------------------------------------------
    def build_features(self, payload):
        """Raw intake dict -> (one-row feature dict, info dict)."""
        errors = []

        vitals, ignored = {}, []
        for name, (lo, hi) in VITAL_BOUNDS.items():
            val = _to_number(payload.get(name), name, errors)
            if val is not None and not (lo <= val <= hi):
                ignored.append(name)
                val = None
            vitals[name] = val

        pain = _to_number(payload.get("pain"), "pain", errors)
        if pain is not None and not (PAIN_BOUNDS[0] <= pain <= PAIN_BOUNDS[1]):
            ignored.append("pain")
            pain = None

        gender = str(payload.get("gender", "")).strip().upper()
        gender = {"MALE": "M", "FEMALE": "F"}.get(gender, gender)
        if gender not in ("M", "F"):
            errors.append("'gender' is required and must be 'M' or 'F'")

        transport = str(payload.get("arrival_transport") or "UNKNOWN").strip().upper()
        if transport not in TRANSPORT_OPTIONS:
            transport = "UNKNOWN"

        arrival = _parse_arrival_time(payload.get("arrival_time"), errors)

        if errors:
            raise ValidationError(errors)

        hr, sbp = vitals["heartrate"], vitals["sbp"]
        shock_index = (hr / sbp) if (hr is not None and sbp is not None) else None

        raw_numeric = {
            "temperature": vitals["temperature"],
            "heartrate": hr,
            "resprate": vitals["resprate"],
            "o2sat": vitals["o2sat"],
            "sbp": sbp,
            "dbp": vitals["dbp"],
            "shock_index": shock_index,
            "pain_numeric": pain,
            # Only one reading exists at triage, so the "aggregate" fields use it
            "hr_mean": hr,
            "hr_max": hr,
            "resprate_max": vitals["resprate"],
            "o2sat_min": vitals["o2sat"],
            "sbp_min": sbp,
            "temp_max": vitals["temperature"],
        }

        row = {}
        for col in NUMERIC_COLS:
            val = raw_numeric[col]
            row[f"{col}_was_missing"] = 1 if val is None else 0
            row[col] = float(self.medians[col]) if val is None else float(val)

        row["arrival_hour"] = arrival.hour
        row["arrival_dayofweek"] = arrival.weekday()          # Monday = 0
        row["is_weekend"] = 1 if arrival.weekday() in (5, 6) else 0
        row["is_night_shift"] = 1 if 0 <= arrival.hour <= 6 else 0

        row["gender_encoded"] = 0 if gender == "M" else 1
        for opt in TRANSPORT_OPTIONS:
            row[f"transport_{opt}"] = 1 if transport == opt else 0

        core = ["temperature", "heartrate", "resprate", "o2sat", "sbp", "dbp"]
        present = [c for c in core if vitals[c] is not None]
        info = {
            "missing_fields": [c for c in core if vitals[c] is None]
            + (["pain"] if pain is None else []),
            "ignored_out_of_range": ignored,
            "vitals_available": len(present),
        }
        return row, info

    # ------------------------------------------------------------------
    def predict(self, payload):
        row, info = self.build_features(payload)

        X = pd.DataFrame([row]).reindex(columns=self.feature_columns).astype(float)
        if X.isna().any().any():
            raise ValueError("Feature construction produced missing values; check feature_columns.json")

        raw = np.asarray(self.model.predict(X)).ravel()[0]
        level = int(round(float(raw))) + 1   # model was trained on labels 0-4
        if level not in TRIAGE_COLOURS:
            raise ValueError(f"Model returned an unexpected class: {raw}")

        probs = np.asarray(self.model.predict_proba(X))[0]
        probabilities = {str(i + 1): round(float(p), 4) for i, p in enumerate(probs)}

        return {
            "acuity": level,
            "triage_label": TRIAGE_COLOURS[level],
            "probabilities": probabilities,
            "manual_assessment_recommended": info["vitals_available"] < MIN_VITALS_FOR_AUTO_TRIAGE,
            "missing_fields": info["missing_fields"],
            "ignored_out_of_range": info["ignored_out_of_range"],
        }

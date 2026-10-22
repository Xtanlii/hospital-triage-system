# Triage Acuity Prediction API (local)

Predicts a patient's acuity level (1 = most severe, 5 = least severe) from intake data.
Model: XGBoost classifier trained on SMOTE-balanced MIMIC-IV-ED data.
Runs on the hospital's local server. No internet connection is needed.

## Files
| File | Purpose |
|---|---|
| `app.py` | The REST API (Flask) |
| `predictor.py` | Turns the raw intake fields into the 38 model features and calls the model |
| `triage_model.pkl` | The trained model |
| `feature_columns.json` | The 38 feature names in the exact order the model expects |
| `medians.json` | Training-set medians, used when a vital is missing |
| `requirements.txt` | Python packages needed |

## Run it
```
pip install -r requirements.txt
python app.py
```
The API starts at `http://127.0.0.1:8000`. To let other machines on the hospital network reach it, set the host first (Windows: `set TRIAGE_API_HOST=0.0.0.0`, then `python app.py`).

Quick check: open `http://127.0.0.1:8000/health` in a browser. You should see `{"status": "ok", "model_features": 38}`.

## POST /predict
Send JSON. Vitals may be `null` or left out if they could not be collected. Do not guess a value.

```json
{
  "temperature": 98.6,
  "heartrate": 110,
  "resprate": 22,
  "o2sat": 94,
  "sbp": 100,
  "dbp": 70,
  "pain": 7,
  "gender": "F",
  "arrival_transport": "AMBULANCE",
  "arrival_time": "2026-10-24T03:30:00"
}
```

| Field | Type | Notes |
|---|---|---|
| `temperature` | number or null | Degrees Fahrenheit |
| `heartrate` | number or null | Beats per minute |
| `resprate` | number or null | Breaths per minute |
| `o2sat` | number or null | Percent |
| `sbp`, `dbp` | number or null | mmHg |
| `pain` | number or null | 0 to 10. Send `null` if the patient cannot report pain |
| `gender` | `"M"` or `"F"` | **Required** |
| `arrival_transport` | string, optional | `AMBULANCE`, `WALK IN`, `HELICOPTER`, `OTHER`, `UNKNOWN` (default `UNKNOWN`) |
| `arrival_time` | ISO datetime, optional | Defaults to the current time (Nigeria, UTC+1) |

Values outside clinically plausible ranges (for example a heart rate of 1228) are treated as missing, and the field name is returned in `ignored_out_of_range`.

### Response (200)
```json
{
  "acuity": 2,
  "triage_label": "Orange",
  "probabilities": {"1": 0.05, "2": 0.61, "3": 0.28, "4": 0.05, "5": 0.01},
  "manual_assessment_recommended": false,
  "missing_fields": ["pain"],
  "ignored_out_of_range": []
}
```

| `acuity` | `triage_label` |
|---|---|
| 1 | Red |
| 2 | Orange |
| 3 | Yellow |
| 4 | Green |
| 5 | Blue |

`manual_assessment_recommended` is `true` when fewer than 3 of the 6 core vitals were usable (for example an unconscious patient with only partial readings). The interface should show a prompt for staff to assess that patient manually.

### Errors
| Status | Meaning |
|---|---|
| 400 | Body is not a JSON object |
| 422 | Invalid input (`details` lists what is wrong, e.g. missing `gender`) |
| 500 | Model or server problem |

## Notes for the integration
- **Aggregate vitals:** the model was trained on vitals summarised over a whole ED stay (`hr_max`, `o2sat_min`, etc.). At triage only one reading exists, so these default to that single reading, which matches how triage works in practice.
- **Missingness:** a missing vital is filled with the training median and flagged to the model as missing. Staff should still be able to override any prediction.
- **Calling from a browser:** CORS is enabled for all origins, so the frontend can call the API directly from another port.

## Known limitations
- Trained on a US hospital dataset (MIMIC-IV-ED). It has not been validated on Nigerian patient data.
- Overall accuracy is about 62%. It is strongest on Level 3 and weaker on the rarest levels (4 and 5). The system supports clinical judgement and does not replace it. All predictions can be overridden by nursing and physician staff.

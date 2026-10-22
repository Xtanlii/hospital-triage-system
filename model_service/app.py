"""
app.py
Local REST API for the triage acuity model.

Run:   python app.py
Then:  POST http://127.0.0.1:8000/predict   (JSON body, see README.md)
       GET  http://127.0.0.1:8000/health
"""

import os

from flask import Flask, jsonify, request

from predictor import TriagePredictor, ValidationError

app = Flask(__name__)

_predictor = None


def get_predictor():
    global _predictor
    if _predictor is None:
        _predictor = TriagePredictor()
    return _predictor


@app.after_request
def add_cors_headers(response):
    # Lets a browser frontend on another port call this API. Restrict the origin
    # in production if the frontend address is fixed.
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/health", methods=["GET"])
def health():
    p = get_predictor()
    return jsonify({"status": "ok", "model_features": len(p.feature_columns)})


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return ("", 204)

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    try:
        result = get_predictor().predict(payload)
    except ValidationError as exc:
        return jsonify({"error": "Invalid input", "details": exc.details}), 422
    except Exception as exc:  # model/feature problem, not the caller's fault
        app.logger.exception("Prediction failed")
        return jsonify({"error": "Prediction failed", "details": [str(exc)]}), 500

    return jsonify(result), 200


if __name__ == "__main__":
    get_predictor()  # load the model now so any problem shows at startup
    host = os.environ.get("TRIAGE_API_HOST", "127.0.0.1")
    port = int(os.environ.get("TRIAGE_API_PORT", "8000"))
    app.run(host=host, port=port)

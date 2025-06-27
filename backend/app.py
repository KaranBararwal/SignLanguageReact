from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import tensorflow as tf
import os
import time

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Get allowed frontend origin from environment (set this on Render as ALLOWED_ORIGIN)
allowed_origin = os.getenv("ALLOWED_ORIGIN")
print(f"Allowing CORS from: {allowed_origin}")
CORS(app, origins=[allowed_origin])

# Load model
MODEL_PATH = "asl_model.keras"
if os.path.exists(MODEL_PATH):
    print(f"✅ Loading model from {MODEL_PATH}")
else:
    raise FileNotFoundError(f"❌ Model file not found at path: {MODEL_PATH}")

model = tf.keras.models.load_model(MODEL_PATH)

# Map labels A-Z excluding 'J'
labels_map = [chr(i) for i in range(65, 91) if i != 74]

def predict_sign(img_array):
    gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (28, 28))
    norm = resized / 255.0
    reshaped = norm.reshape(1, 28, 28, 1)

    prediction = model.predict(reshaped)
    predicted_label = labels_map[np.argmax(prediction)]
    return predicted_label

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "API is running"})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        start = time.time()  # Add this
        data = request.json.get("image")
        if not data:
            return jsonify({"error": "No image data provided"}), 400

        header, encoded = data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Failed to decode image"}), 400

        label = predict_sign(frame)
        print("Prediction took", time.time() - start, "seconds")  # Add this
        return jsonify({"prediction": label})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Render uses its own port via $PORT
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import base64
import tensorflow as tf
from tensorflow.keras.models import load_model
import io

app = Flask(__name__)
model = tf.keras.models.load_model("asl_model.keras")
labels_map = [chr(i) for i in range(65, 91) if i != 74]  # A-Z excluding 'J'

def predict_sign(img_array):
    gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (28, 28))
    norm = resized / 255.0
    reshaped = norm.reshape(1, 28, 28, 1)
    prediction = model.predict(reshaped)
    return labels_map[np.argmax(prediction)]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json['image']
        header, encoded = data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        label = predict_sign(frame)
        return jsonify({"prediction": label})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True) 
import React, { useRef, useState, useEffect } from "react";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [prediction, setPrediction] = useState("");

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Error accessing the camera: ", err);
      });
  };

  // 🔴 Draw red rectangle on overlay canvas
  useEffect(() => {
    const drawRectangle = () => {
      const canvas = overlayCanvasRef.current;
      const ctx = canvas.getContext("2d");

      const width = 200;
      const height = 200;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      requestAnimationFrame(drawRectangle);
    };

    drawRectangle();
  }, []);

  // 📸 Capture only the scanning box area from video
  const captureAndPredict = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const boxSize = 200;
    const x = (videoRef.current.videoWidth - boxSize) / 2;
    const y = (videoRef.current.videoHeight - boxSize) / 2;

    // Resize canvas to match box
    canvas.width = boxSize;
    canvas.height = boxSize;

    ctx.drawImage(videoRef.current, x, y, boxSize, boxSize, 0, 0, boxSize, boxSize);

    const imageData = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await res.json();
      setPrediction(data.prediction || "Error in prediction");
    } catch (err) {
      setPrediction("Failed to fetch prediction");
    }
  };

  return (
    <div className="container">
      <h1>Sign Language Live Detector</h1>

      <div style={{ position: "relative", width: 400, height: 300, margin: "0 auto" }}>
        <video
          ref={videoRef}
          autoPlay
          width="400"
          height="300"
          style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
        />
        <canvas
          ref={overlayCanvasRef}
          width="400"
          height="300"
          style={{ position: "absolute", top: 0, left: 0, zIndex: 2, pointerEvents: "none" }}
        />
        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={startCamera}>📷 Start Camera</button>
        <button onClick={captureAndPredict}>🤖 Predict</button>
      </div>

      <div className="prediction-box">
        Prediction: <strong>{prediction}</strong>
      </div>
</div>

  );
}

export default App;
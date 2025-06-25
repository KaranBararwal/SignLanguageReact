const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const result = document.getElementById("result");

// Start webcam
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
});

function captureFrame() {
  const ctx = canvas.getContext("2d");
  canvas.width = 224;
  canvas.height = 224;
  ctx.drawImage(video, 100, 100, 200, 200, 0, 0, 224, 224);

  const dataURL = canvas.toDataURL("image/jpeg");

  fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataURL }),
  })
    .then((res) => res.json())
    .then((data) => {
      result.textContent = data.prediction ? `Prediction: ${data.prediction}` : `Error: ${data.error}`;
    });
}
console.log("script loaded");

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const countdownEl = document.getElementById("countdown");
const stripPreview = document.getElementById("stripPreview");
const downloadStrip = document.getElementById("downloadStrip");
const filterSelect = document.getElementById("filterSelect");
const preControls = document.getElementById("preControls");
const postControls = document.getElementById("postControls");
const cameraTitle = document.getElementById("cameraTitle");
const stripTitle = document.getElementById("stripTitle");
const stripLine = document.getElementById("stripLine");
const flash = document.getElementById("flash");
const cameraWrapper = document.querySelector(".camera-wrapper");
const layoutSelect = document.getElementById("layoutSelect");
const shutterSound = new Audio("shutter.mp3");

const photos = [];
const PHOTO_COUNT = 3;
const DELAY = 3;
modeSelect.onchange = () => {
  if (modeSelect.value === "video") {
    videoControls.style.display = "flex";
  } else {
    videoControls.style.display = "none";
  }
};
function showRecordedVideo() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);

  // Show video preview
  videoPreview.src = url;
  videoPreview.style.display = "block";

  // Hide camera + controls
  cameraWrapper.style.display = "none";
  cameraTitle.style.display = "none";
  preControls.style.display = "none";
  videoControls.style.display = "none";

  // Show post controls
  postControls.innerHTML = "";

  const retakeBtn = document.createElement("button");
  retakeBtn.textContent = "Wanna Retake!";
  retakeBtn.onclick = resetBooth;

  const download = document.createElement("a");
  download.href = url;
  download.download = "photobooth-video.webm";
  download.textContent = "Download Video";

  postControls.appendChild(retakeBtn);
  postControls.appendChild(download);
  postControls.style.display = "flex";

  stopCamera();
}

let mediaRecorder;
let recordedChunks = [];
let canvasStream;
let recordingTimeout;

let stream = null;

/* ================= CAMERA CONTROL ================= */

function startCamera() {
  if (stream) return; // prevent duplicate streams

  navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 }
  })
  .then(s => {
    stream = s;
    video.srcObject = stream;
  })
  .catch(() => alert("Camera access denied"));
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
  }
}

startCamera();

/* ================= FILTER ================= */

filterSelect.onchange = () => {
  video.style.filter = filterSelect.value;
};

/* ================= CURTAINS ================= */

function openCurtains() {
  console.log("openCurtains called");
  document.body.classList.add("curtain-open");
}


function closeCurtains() {
  document.body.classList.remove("curtain-open");
}

/* ================= PHOTO STRIP ================= */

async function startPhotoStrip() {
  const mode = modeSelect.value;
  // PHOTO MODE (existing logic)
  openCurtains();
  preControls.style.display = "none";
  postControls.style.display = "none";
  photos.length = 0;

  const layout = layoutSelect.value;

  let shots = 3;
  if (layout === "single") shots = 1;
  if (layout === "grid") shots = 4;

  for (let i = 0; i < shots; i++) {
    await countdown();
    capturePhoto();
  }

  createStrip();
}
/* ================= COUNTDOWN ================= */

function countdown() {
  return new Promise(resolve => {
    const steps = ["1", "2", "3", "Say Cheese! 📸"];
    let index = 0;

    countdownEl.innerText = steps[index];

    const timer = setInterval(() => {
      index++;

      if (index < steps.length) {
        countdownEl.innerText = steps[index];
      } else {
        clearInterval(timer);

        triggerFlashAndSound();

        setTimeout(() => {
          countdownEl.innerText = "";
          resolve();
        },300);
      }
    }, 1000);
  });
}

/* ================= CAPTURE ================= */

function capturePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.filter = filterSelect.value;
  ctx.drawImage(video, 0, 0);
  ctx.filter = "none";

  photos.push(canvas.toDataURL("image/png"));
}

/* ================= STRIP CREATION ================= */

function createStrip() {
  console.log("Selected layout:", layoutSelect.value);
  const layout = layoutSelect.value;

  if (layout === "strip") {
    createVerticalStrip();
  } else if (layout === "grid") {
    createGridLayout();
  } else if (layout === "single") {
    createSinglePhoto();
  }
}
function createVerticalStrip() {
  const stripCanvas = document.createElement("canvas");
  const stripCtx = stripCanvas.getContext("2d");

  const img = new Image();
  img.src = photos[0];

  img.onload = () => {
    const w = img.width;
    const h = img.height;
    const padding = 20;
    const gap = 15;

    stripCanvas.width = w + padding * 2;
    stripCanvas.height =
      (h * PHOTO_COUNT) + gap * (PHOTO_COUNT - 1) + padding * 2;

    stripCtx.fillStyle = "#fff";
    stripCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

    photos.forEach((src, i) => {
      const im = new Image();
      im.src = src;
      im.onload = () => {
        stripCtx.drawImage(
          im,
          padding,
          padding + i * (h + gap),
          w,
          h
        );

        if (i === photos.length - 1) {
          finishStrip(stripCanvas);
        }
      };
    });
  };
}
function createGridLayout() {
  const stripCanvas = document.createElement("canvas");
  const stripCtx = stripCanvas.getContext("2d");

  const img = new Image();
  img.src = photos[0];

  img.onload = () => {
    const w = img.width;
    const h = img.height;
    const cols = 2;
    const rows = Math.ceil(PHOTO_COUNT / cols);
    const padding = 20;
    const gap = 15;

    stripCanvas.width = cols * w + gap * (cols - 1) + padding * 2;
    stripCanvas.height = rows * h + gap * (rows - 1) + padding * 2;
    stripCtx.fillStyle = "#fff";
    stripCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
 let loadedImages = 0;
    photos.forEach((src, i) => {
      const im = new Image();
      im.src = src;

      const x = padding + (i % cols) * (w + gap);
      const y = padding + Math.floor(i / cols) * (h + gap);

      im.onload = () => {
        stripCtx.drawImage(im, x, y, w, h);
        loadedImages++;
        if (loadedImages === photos.length) {
          finishStrip(stripCanvas);
        }
      };
    });
  };
}
function createSinglePhoto() {
  const stripCanvas = document.createElement("canvas");
  const stripCtx = stripCanvas.getContext("2d");

  const img = new Image();
  img.src = photos[1] || photos[0]; // middle shot preferred

  img.onload = () => {
    const padding = 30;

    stripCanvas.width = img.width + padding * 2;
    stripCanvas.height = img.height + padding * 2;

    stripCtx.fillStyle = "#fff";
    stripCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

    stripCtx.drawImage(img, padding, padding);

    finishStrip(stripCanvas);
  };
}
function finishStrip(stripCanvas) {
  const stripCtx = stripCanvas.getContext("2d");

  // Footer background (optional but looks premium)
  stripCtx.fillStyle = "#fff";
  stripCtx.fillRect(
    0,
    stripCanvas.height - 60,
    stripCanvas.width,
    60
  );

  // Branding text
  stripCtx.fillStyle = "rgba(229, 92, 179, 1)";
  stripCtx.font = "bold 22px Brush Script MT";
  stripCtx.textAlign = "center";
  stripCtx.fillText(
    "Have a great Day !",
    stripCanvas.width / 2,
    stripCanvas.height - 35
  );

  // Date & Time
  stripCtx.font = "22px Brush Script MT";
  stripCtx.fillText(
    getDateTimeText(),
    stripCanvas.width / 2,
    stripCanvas.height - 12
  );

  const data = stripCanvas.toDataURL("image/png");

  stripPreview.src = data;
  stripPreview.style.display = "block";
  downloadStrip.href = data;

  cameraWrapper.style.display = "none";
  cameraTitle.style.display = "none";

  stripTitle.style.display = "block";
  stripLine.style.display = "block";
  postControls.style.display = "flex";

  stopCamera();
}


/* ================= RETAKE ================= */

function resetBooth() {
  closeCurtains();

  stripPreview.style.display = "none";
  videoPreview.style.display = "none";
  stripTitle.style.display = "none";
  stripLine.style.display = "none";
  postControls.style.display = "none";
  videoControls.style.display = "none";

  setTimeout(() => {
    cameraWrapper.style.display = "block";
    cameraTitle.style.display = "block";
    preControls.style.display = "flex";
    startCamera();
    openCurtains();
  }, 800);
}


/* ================= FLASH & SOUND ================= */

function triggerFlashAndSound() {
  flash.classList.add("flash-active");

  shutterSound.currentTime = 0;
  shutterSound.play();

  setTimeout(() => {
    flash.classList.remove("flash-active");
  }, 300);
}

/* ================= VISIBILITY HANDLING ================= */

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopCamera();
  } else {
    startCamera();
  }
});
window.openCurtains = openCurtains;
window.closeCurtains = closeCurtains;
// Open curtains automatically when page loads
window.addEventListener("load", () => {
  setTimeout(() => {
    openCurtains();
  }, 500); // small delay for dramatic effect
});
function getDateTimeText() {
  const now = new Date();

  const date = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return `${date} • ${time}`;
}
function handleShutter() {
  const mode = modeSelect.value;

  if (mode === "photo") {
    startPhotoStrip();
  } else if (mode === "video") {
    startRecording();
    videoControls.style.display = "none"; // hide buttons once recording starts
  }
}

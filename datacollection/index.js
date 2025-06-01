import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const enableWebcamButton = document.getElementById("webcamButton");
const canvasCtx = canvasElement.getContext("2d");
const drawingUtils = new DrawingUtils(canvasCtx);

let poseLandmarker = undefined;
let webcamRunning = false;
let globalresult;

const videoWidth = 1280;
const videoHeight = 720;

// Start de applicatie als DOM geladen is
document.addEventListener("DOMContentLoaded", () => {
    if (navigator.mediaDevices?.getUserMedia) {
        createPoseLandmarker();
    } else {
        console.warn("getUserMedia() is not supported by your browser");
    }
});

// Laad PoseLandmarker
async function createPoseLandmarker() {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 2
    });

    enableWebcamButton.addEventListener("click", enableCam);
    enableWebcamButton.innerText = "Start de Game!";
    console.log("PoseLandmarker is ready!");
}

// Webcam starten en predictie loop starten
function enableCam() {
    if (!poseLandmarker) {
        console.log("PoseLandmarker not loaded yet.");
        return;
    }

    webcamRunning = true;
    enableWebcamButton.innerText = "Detecting...";
    enableWebcamButton.disabled = true;

    navigator.mediaDevices.getUserMedia({
        video: {
            width: { exact: videoWidth },
            height: { exact: videoHeight }
        }
    }).then((stream) => {
        video.srcObject = stream;
        video.play(); // zorg dat de video echt afspeelt

        video.addEventListener("loadeddata", () => {
            video.width = videoWidth;
            video.height = videoHeight;
            canvasElement.width = videoWidth;
            canvasElement.height = videoHeight;
            predictWebcam(); // start de analyse-loop
        });
    }).catch(err => {
        console.error("Webcam access failed:", err);
    });
}

// Voorspellen en tekenen
function predictWebcam() {
    if (!webcamRunning) return;

    poseLandmarker.detectForVideo(video, performance.now(), result => {
        drawPose(result);
        window.requestAnimationFrame(predictWebcam);
    });
}

// Pose tekenen op canvas
function drawPose(result) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    globalresult = result;

    for (const landmark of result.landmarks) {
        drawingUtils.drawLandmarks(landmark, { radius: 3 });
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
    }
}

// Posegegevens opslaan
function capturePose(poseName) {
    if (!globalresult?.landmarks?.[0]) {
        console.warn("Geen pose gevonden om op te slaan.");
        return;
    }

    const poseData = [];
    for (let landmark of globalresult.landmarks[0]) {
        poseData.push(landmark.x, landmark.y, landmark.z);
    }

    console.log(`Pose: ${poseName}`, poseData);
}

// Buttons koppelen aan pose capture
document.querySelectorAll('button[data-pose]').forEach(button => {
    button.addEventListener('click', (event) => {
        const pose = event.target.getAttribute('data-pose');
        capturePose(pose);
    });
});

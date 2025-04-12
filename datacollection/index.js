import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const enableWebcamButton = document.getElementById("webcamButton");
const canvasCtx = canvasElement.getContext("2d");
const drawingUtils = new DrawingUtils(canvasCtx);

let poseLandmarker = undefined;
let webcamRunning = false;
let lastVideoTime = -1;
let globalresult

const videoWidth = "480px"
const videoHeight = "270px"


// if webcam access, load landmarker and enable webcam button
function startApp() {
    const hasGetUserMedia = () => { var _a; return !!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia); };
    if (hasGetUserMedia()) {
        createPoseLandmarker();
    } else {
        console.warn("getUserMedia() is not supported by your browser");
    }
}

// create mediapipe
const createPoseLandmarker = async () => {
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
    enableWebcamButton.innerText = "Start de Game!"
    console.log("poselandmarker is ready!")
};

// enable webcam
function enableCam(event) {
    console.log("start the webcam")
    if (!poseLandmarker) {
        console.log("Wait! poseLandmaker not loaded yet.");
        return;
    }
    webcamRunning = true;
    enableWebcamButton.innerText = "Predicting";
    enableWebcamButton.disabled = true

    const constraints = {
        video: {
            width: { exact: 480 },
            height: { exact: 270 }
        }
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", async () => {
            canvasElement.style.height = videoHeight;
            canvasElement.style.width = videoWidth;
            video.style.height = videoHeight;
            video.style.width = videoWidth;
            predictWebcam();
        });
    });
}

// predict webcam
async function predictWebcam() {
    let startTimeMs = performance.now();
    poseLandmarker.detectForVideo(video, performance.now(), (result) => drawPose(result));

    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// draw the poses or log them in the console
function drawPose(result) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // log de coordinaten
    //console.log(result)
    globalresult = result
    // teken de coordinaten in het canvas
    for (const landmark of result.landmarks) {
        drawingUtils.drawLandmarks(landmark, { radius: 3 });
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
    }
}

function capturePose(pose) {
  console.log(`Show data for ${pose} pose`);
  // console.log(globalresult.landmarks[0]);

  let temp = [];

  for (let landmark of globalresult.landmarks[0]) {
    console.log(landmark.x);
    console.log(landmark.y);
    console.log(landmark.z);
    temp.push(landmark.x, landmark.y, landmark.z);
  }
  console.log(temp);
}

const buttons = document.querySelectorAll('button[data-pose]');
buttons.forEach(button => {
  button.addEventListener('click', (event) => {
    const pose = event.target.getAttribute('data-pose');
    capturePose(pose);
  });
});



startApp()

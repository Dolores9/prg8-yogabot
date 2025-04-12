import kNear from "./knear.js";

const k = 3;
const machine = new kNear(k);

//JSON data fetch
async function trainModel() {
    try {
        const response = await fetch('../datacollection/data.JSON');
        const data = await response.json();
        console.log("originele data", data);

        const cleanData = {};
        for (const [poseType, poses] of Object.entries(data)) {
            cleanData[poseType] = poses.filter(isValidPose);
            console.log(`Number of valid ${poseType}:`, cleanData[poseType].length);
            console.log(`Number of invalid ${poseType}:`, poses.length - cleanData[poseType].length);
        }

        console.log("Cleaned data:", cleanData);

        for (const [poseType, poses] of Object.entries(cleanData)) {
            poses.forEach(pose => {
                machine.learn(pose, poseType);
            });
        }

        console.log('Model training is complete.');
    } catch (error) {
        console.error('Error fetching or processing the JSON data:', error);
    }
}

function isValidPose(pose) {
    // Controleer of het aantal waarden correct is
    if (pose.length !== 99) {
        console.log("Invalid pose length:", pose);
        return false;
    }

    // Controleer of alle waarden binnen het bereik van -1 tot 1 liggen
    for (let value of pose) {
        if (value < -1 || value > 1) {
            console.log("Invalid value in pose:", pose);
            return false;
        }
    }

    return true;
}
export {trainModel};

// model trainen
trainModel();



// Webcam en pose-detectie setup
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const enableWebcamButton = document.getElementById("webcamButton");
const classifyButton = document.getElementById("classifyButton");
const canvasCtx = canvasElement.getContext("2d");
const drawingUtils = new DrawingUtils(canvasCtx);


let poseLandmarker = undefined;
let webcamRunning = false;
let globalresult;


const videoWidth = "1280px";
const videoHeight = "720px";


// Check voor webcam toegang en start de applicatie
function startApp() {
    const hasGetUserMedia = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (hasGetUserMedia()) {
        createPoseLandmarker();
    } else {
        console.warn("getUserMedia() is not supported by your browser");
    }
}

// Maak de PoseLandmarker aan
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
    enableWebcamButton.innerText = "Start de Yoga detector!";
    classifyButton.addEventListener("click", classifyCurrentPose);
    console.log("PoseLandmarker is ready!");
};

// Webcam inschakelen en starten met pose detectie
function enableCam(event) {
    console.log("Start the webcam");
    if (!poseLandmarker) {
        console.log("Wait! Not loaded yet.");
        return;
    }
    webcamRunning = true;
    // enableWebcamButton.innerText = "Predicting";
    enableWebcamButton.disabled = true;
    classifyButton.style.display = "inline-block"; // Laat de classify knop zien

    const constraints = {
        video: {
            width: { exact: 1280 },
            height: { exact: 720 }
        }
    };

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

// Voorspellen met de webcam
async function predictWebcam() {
    poseLandmarker.detectForVideo(video, performance.now(), (result) => drawPose(result));
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Pose tekenen en opslaan in globalresult
function drawPose(result) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    globalresult = result;
    for (const landmark of result.landmarks) {
        drawingUtils.drawLandmarks(landmark, { radius: 3 });
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
    }
}

// Pose gegevens vastleggen en classificeren
function capturePose() {
    console.log(`Show data for pose`);
    let temp = [];
    for (let landmark of globalresult.landmarks[0]) {
        temp.push(landmark.x, landmark.y, landmark.z);
    }
    return temp;
}

// Huidige pose classificeren
function classifyCurrentPose() {
    if (!globalresult || !globalresult.landmarks || globalresult.landmarks.length === 0) {
        console.log("No pose detected to classify.");
        return;
    }
    const features = capturePose();
    let prediction = machine.classify(features);
    console.log(`I think this is a ${prediction}`);
    predictionText.textContent = `I think this is a ${prediction}`;
}

// Start de applicatie zodra de pagina geladen is
document.addEventListener("DOMContentLoaded", startApp);

startApp();
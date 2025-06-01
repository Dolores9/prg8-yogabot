import kNear from "./knear.js";

// Functie om JSON-data te splitsen in trainings- en testdatasets
function splitData(data, splitRatio = 0.8) {
    const trainData = {};
    const testData = {};

    for (const [poseType, poses] of Object.entries(data)) {
        const validPoses = poses.filter(isValidPose);
        const splitIndex = Math.floor(validPoses.length * splitRatio);
        trainData[poseType] = validPoses.slice(0, splitIndex);
        testData[poseType] = validPoses.slice(splitIndex);
    }

    return { trainData, testData };
}

// Functie om de nauwkeurigheid van het model te berekenen
function calculateAccuracy(machine, testData) {
    let correctPredictions = 0;
    let totalPredictions = 0;

    for (const [poseType, poses] of Object.entries(testData)) {
        poses.forEach(pose => {
            const prediction = machine.classify(pose);
            if (prediction === poseType) {
                correctPredictions++;
            }
            totalPredictions++;
        });
    }

    return correctPredictions / totalPredictions;
}

// Functie om de valideren
function isValidPose(pose) {
    if (pose.length !== 99) {
        return false;
    }
    for (let value of pose) {
        if (value < -1 || value > 1) {
            return false;
        }
    }
    return true;
}

// Functie om de data op te halen en te splitsen
async function getData() {
    const response = await fetch('./data.JSON');
    const data = await response.json();
    return splitData(data);
}

// Main functie
async function main() {
    const { trainData, testData } = await getData();

    const kValues = [1, 3, 5, 7, 9];
    let bestK = kValues[0];
    let bestAccuracy = 0;
    let bestMachine;

    for (let k of kValues) {
        const machine = new kNear(k);

        for (const [poseType, poses] of Object.entries(trainData)) {
            poses.forEach(pose => {
                machine.learn(pose, poseType);
            });
        }

        const accuracy = calculateAccuracy(machine, testData);
        console.log(`Accuracy met k=${k}: ${(accuracy * 100).toFixed(2)}%`);

        if (accuracy > bestAccuracy) {
            bestAccuracy = accuracy;
            bestK = k;
            bestMachine = machine;
        }
    }

    console.log(`Beste accuracy: ${(bestAccuracy * 100).toFixed(2)}% met k=${bestK}`);
}

main();

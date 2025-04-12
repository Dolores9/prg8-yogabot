import kNear from "./knear.js";
import { trainModel } from "./train.js"; 

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

// Functie om de validiteit van een pose te controleren
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
    const response = await fetch('../datacollection/data.JSON');
    const data = await response.json();
    return splitData(data);
}

// Functie om een confusiematrix te genereren
function generateConfusionMatrix(machine, testData) {
    const labels = Object.keys(testData);
    const matrix = labels.map(() => Array(labels.length).fill(0));

    for (const [actualLabel, poses] of Object.entries(testData)) {
        poses.forEach(pose => {
            const predictedLabel = machine.classify(pose);
            const actualIndex = labels.indexOf(actualLabel);
            const predictedIndex = labels.indexOf(predictedLabel);
            matrix[actualIndex][predictedIndex]++;
        });
    }

    return { labels, matrix };
}

// Verbeterde printfunctie voor de confusiematrix
function printConfusionMatrix(matrixData) {
    const { labels, matrix } = matrixData;

    console.log("Confusion Matrix:");
    console.log("\t" + labels.join("\t"));
    matrix.forEach((row, index) => {
        console.log(`${labels[index]}\t${row.join("\t")}`);
    });
}


// Belangrijkste uitvoer van het script
async function main() {
    const { trainData, testData } = await getData(); // Train en test data ophalen

    // Mogelijke waarden van k om te testen
    const kValues = [1, 3, 5, 7, 9];
    let bestK = kValues[0];
    let bestAccuracy = 0;
    let bestMachine;

    // Loop door elke k-waarde
    for (let k of kValues) {
        const machine = new kNear(k); // Maak een nieuw k-NN model met de huidige k-waarde
        
        // Train het model opnieuw met de huidige waarde van k
        for (const [poseType, poses] of Object.entries(trainData)) {
            poses.forEach(pose => {
                machine.learn(pose, poseType);
            });
        }
        
        // Bereken de nauwkeurigheid
        const accuracy = calculateAccuracy(machine, testData);
        console.log(`Accuracy with k=${k}: ${accuracy * 100}%`);
        
        // Update de beste k en nauwkeurigheid als de huidige beter is
        if (accuracy > bestAccuracy) {
            bestAccuracy = accuracy;
            bestK = k;
            bestMachine = machine;
        }
    }

    console.log(`Best accuracy: ${bestAccuracy * 100}% with k=${bestK}`);

    // Print de confusiematrix voor het beste model
    const matrixData = generateConfusionMatrix(bestMachine, testData);
    printConfusionMatrix(matrixData);
}

main();

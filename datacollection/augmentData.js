const fs = require('fs');
const path = require('path');

// Functie om de gegevens te laden vanuit data.JSON
function loadOriginalData() {
    const filePath = path.resolve(__dirname, '../datacollection/data.JSON'); // Pas de pad aan naar jouw bestand
    const rawData = fs.readFileSync(filePath);
    const data = JSON.parse(rawData);
    return data;
}

// Functie om een pose te augmenteren
function augmentPose(originalPose) {
    // Voeg een kleine verschuiving toe aan elke waarde
    return originalPose.map(value => value + (Math.random() * 0.05 - 0.025));
}

// Functie om nieuwe geaugmenteerde gegevens te genereren
function generateAugmentedData(originalData) {
    const augmentedData = {};

    for (const [poseType, poses] of Object.entries(originalData)) {
        augmentedData[poseType] = [];

        poses.forEach(pose => {
            const augmentedPose = augmentPose(pose);
            augmentedData[poseType].push(augmentedPose);
        });
    }

    return augmentedData;
}

// Hoofdlogica om gegevens te laden, te augmenteren en op te slaan
async function main() {
    try {
        const originalData = loadOriginalData();
        const augmentedData = generateAugmentedData(originalData);

        // Combineer de originele en geaugmenteerde gegevens
        const newData = { ...originalData };

        for (const [poseType, poses] of Object.entries(augmentedData)) {
            newData[poseType] = newData[poseType].concat(poses);
        }

        // Sla de gecombineerde gegevens op in data.JSON
        const filePath = path.resolve(__dirname, 'data.JSON'); // Pas de pad aan naar jouw bestand
        fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));

        console.log('Augmented data is toegevoegd aan data.JSON.');
    } catch (error) {
        console.error('Er is een fout opgetreden bij het uitvoeren van data-augmentatie:', error);
    }
}

main();

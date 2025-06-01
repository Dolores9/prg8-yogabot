const fs = require('fs');
const path = require('path');

// Gegevens inladen vanuit data.JSON
function loadOriginalData() {
    const filePath = path.resolve(__dirname, 'data.JSON'); 
    const rawData = fs.readFileSync(filePath);
    const data = JSON.parse(rawData);
    return data;
}

// Functie om een pose te augmenteren
function augmentPose(originalPose) {
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

        const newData = { ...originalData };

        for (const [poseType, poses] of Object.entries(augmentedData)) {
            newData[poseType] = newData[poseType].concat(poses);
        }

        const filePath = path.resolve(__dirname, 'data.JSON'); 
        fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));

        console.log('Augmented data is toegevoegd aan data.JSON.');
    } catch (error) {
        console.error('Er is een fout opgetreden:', error);
    }
}

main();

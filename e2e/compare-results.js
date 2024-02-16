const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const path = require('path');

const testResultsDir = './test-results';
const refResultsDir = './reference-results';

let totalDifferences = 0; // Keep track of total differences

fs.readdir(testResultsDir, (err, files) => {
    if (err) {
        console.error('Error listing test-results directory', err);
        process.exit(1); // Exit with error code if we can't read the directory
    }

    files.forEach(file => {
        if (path.extname(file) === '.png') {
            const testImagePath = path.join(testResultsDir, file);
            const refImagePath = path.join(refResultsDir, file);

            if (!fs.existsSync(refImagePath)) {
                console.error(`Reference image does not exist for ${file}`);
                totalDifferences++; // Increment differences if reference image is missing
                return;
            }

            const testImage = PNG.sync.read(fs.readFileSync(testImagePath));
            const refImage = PNG.sync.read(fs.readFileSync(refImagePath));

            const {width, height} = testImage;
            const diff = new PNG({width, height});

            const mismatchedPixels = pixelmatch(testImage.data, refImage.data, diff.data, width, height, {threshold: 0.1});

            if (mismatchedPixels > 0) {
                console.log(`${file} has differences`);
                const diffPath = path.join(testResultsDir, `diff-${file}`);
                fs.writeFileSync(diffPath, PNG.sync.write(diff));
                totalDifferences++; // Increment differences for each mismatch
            } else {
                console.log(`${file} matches the reference.`);
            }
        }
    });

    if (totalDifferences > 0) {
        console.error(`Found ${totalDifferences} images with differences.`);
        process.exit(1); // Exit with error if any differences were found
    }
});

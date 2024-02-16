const puppeteer = require('puppeteer');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function writeLog(filePath, data) {
    fs.appendFileSync(filePath, `${data}\n`); // Append data with a newline at the end
}

async function startFlaskApp(command, args, logPath, launchDir) {
    const server = spawn(command, args, {
        cwd: path.resolve(launchDir), // Resolve the launchDir to an absolute path
        shell: true, // Consider setting shell: true for compatibility with shell commands
    });

    const serverReady = new Promise(resolve => {
        const readyMsg = 'Chalk\'it launched on http://127.0.0.1:7854';
        function checkData(data) {
            const message = data.toString();
            writeLog(logPath, message);
            if (message.includes(readyMsg)) {
                console.log('Server is ready!');
                server.stdout.removeListener('data', checkData);
                resolve(true);
            }
        }
        server.stdout.on('data', checkData);
        server.stderr.on('data', data => {
            const errorMessage = data.toString();
            writeLog(logPath, errorMessage);
        });
    });

    await Promise.race([
        serverReady,
        delay(15000)
    ]);

    return server;
}

async function takeScreenshot(url, outputPath, testName, delaySeconds = 0, width = 1920, height = 1080) {
    const browserConsoleLogPath = path.join(outputPath, `${testName}_browser_console.txt`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => {
        const logMessage = `${msg.type().toUpperCase()}: ${msg.text()}`;
        console.log(logMessage);
        writeLog(browserConsoleLogPath, logMessage);
    });
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle2' });
    if (delaySeconds > 0) {
        await delay(delaySeconds * 1000);
    }
    await page.screenshot({ path: path.join(outputPath, `${testName}.png`) });
    await browser.close();
    console.log(`Screenshot taken and saved as ${testName}.png in ${outputPath}`);
}

async function readTestConfig(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) reject(err);
            resolve(JSON.parse(data));
        });
    });
}

async function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Function to terminate the Flask application
function terminateFlaskApp(flaskApp) {
    // Check if the process is running on Windows
    if (process.platform === "win32") {
      // Use taskkill to force terminate the process by PID on Windows
      const command = `taskkill /PID ${flaskApp.pid} /F`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error terminating Flask app: ${error}`);
          return;
        }
        console.log('Flask app terminated successfully.');
      });
    } else {
      // For non-Windows platforms, attempt the standard SIGTERM
      process.kill(flaskApp.pid, 'SIGTERM');
    }
  }

const args = process.argv.slice(2);
const outputDir = args.includes('--reference') ? 'reference-results' : args.includes('--test') ? 'test-results' : 'output-results';

// Example launch directory specified as a relative path or via command line arguments
const launchDir = '../documentation/Templates/Projects/'; // Default value or from command line args

(async () => {
    ensureDirectoryExists(outputDir);

    const testConfigPath = 'test-templates-spec.json';
    const config = await readTestConfig(testConfigPath);
    for (const file of config.files) {
        const testName = path.basename(file, '.xprjson');
        const pyConsoleLogPath = path.join(outputDir, `${testName}_py_console.txt`);
        // Pass the launchDir to startFlaskApp
        const flaskServer = await startFlaskApp('chalk-it', ['--render', file], pyConsoleLogPath, launchDir);
        await takeScreenshot('http://localhost:7854', outputDir, testName, 5, 1920, 1080);
        terminateFlaskApp(flaskServer);

    }
    console.log('All screenshots have been captured.');
    return 0;
})();


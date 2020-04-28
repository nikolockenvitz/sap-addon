const fs = require("fs");
const path = require("path");
const exec = require('child_process').exec;
const AdmZip = require('adm-zip');

const DIRECTORY_NAME_XPI = "xpi";
const FILEPATH_MANIFEST  = "manifest.json";
const FILEPATH_UPDATES   = "updates.json";
const FILEPATH_README    = "README.md";

// name of current directory must match repository and addon name
const REPOSITORY_NAME = path.basename(process.cwd());
const URL_UPDATES     = `https://nikolockenvitz.github.io/${REPOSITORY_NAME}`;
const AMO_URL = "https://addons.mozilla.org/en-US/developers/addon/61a504687c984937a292/versions/submit/";

const ZIP_CONTENT = {
    folders: [
        "background_scripts",
        "content_scripts",
        "icons",
        "popup",
    ],
    files: [
        "manifest.json",
    ],
};

const README_BADGE_INSERT_START = "<!-- SHIELD IO BADGES INSTALL START -->";
const README_BADGE_INSERT_END   = "<!-- SHIELD IO BADGES INSTALL END -->";

const CONSOLE_LOG_COLOR_FG_RED   = "\x1b[31m";
const CONSOLE_LOG_COLOR_FG_GREEN = "\x1b[32m";
const CONSOLE_LOG_COLOR_RESET    = "\x1b[0m";

const LIST_OF_COMMANDS = `
npm run help           logs this help
npm run build          zips all files into ${getZipFilename()}
npm run build -- amo   + opens the AMO page to upload a new version for this addon
npm run deploy         adds xpi to updates.json and README.md + deletes previous versions
`;

async function main () {
    const options = process.argv.slice(3);
    switch (process.argv[2]) {
        case "help":
            logListOfCommands();
            break;
        case "build":
            await buildAddon();
            if (options.includes("amo")) {
                openAMOAddonUpload();
            }
            break;
        case "deploy":
            deployAddon();
            break;
    }
}
main();


function logListOfCommands () {
    logInfo(LIST_OF_COMMANDS);
}


async function buildAddon () {
    // creates a .zip to be uploaded to AMO
    const zipFilename = getZipFilename();

    await deletePreviousZipFile(zipFilename);
    await createZip(zipFilename);

    logSuccess(`created ${zipFilename}`);
}

function getZipFilename () {
    return `${REPOSITORY_NAME}.zip`;
}

async function deletePreviousZipFile (zipFilename) {
    try {
        await deleteFile(zipFilename);
    } catch {}
}

async function createZip (zipFilename) {
    const zip = new AdmZip();
    for (let folder of ZIP_CONTENT.folders) {
        zip.addLocalFolder(folder, folder);
    }
    for (let file of ZIP_CONTENT.files) {
        const filepath = path.dirname(file);
        zip.addLocalFile(file, filepath !== "." ? filepath : undefined);
    }
    zip.writeZip(zipFilename);
}

function openAMOAddonUpload () {
    if (AMO_URL) {
        executeCommand(`start ${AMO_URL}`);
    }
}


async function deployAddon () {
    // adds new addon version to updates.json and README.md + removes previous
    const version = await getVersion();
    const xpiFilepath = await getFilepathOfXPI(version);
    if (!xpiFilepath) {
        logError(`You need to download the .xpi of v${version} before you can run this deploy script`);
        return;
    }
    const xpiFileHash = await getFileHash(xpiFilepath);

    await updateUpdatesJSON(version, xpiFilepath, xpiFileHash);
    await updateReadme(version, xpiFilepath);

    logSuccess(`added ${xpiFilepath} to ${FILEPATH_UPDATES} and ${FILEPATH_README}`);
}

async function getVersion () {
    const manifest = await readFile(FILEPATH_MANIFEST);
    return JSON.parse(manifest).version;
}

async function getFilepathOfXPI (version) {
    const directoryContent = await executeCommand(`dir ${DIRECTORY_NAME_XPI}`);
    for (let line of directoryContent.split("\n")) {
        if (line.includes(version) && line.includes(".xpi")) {
            const filename = line.split(" ").pop().trim();
            return `${DIRECTORY_NAME_XPI}/${filename}`;
        }
    }
}

async function getFileHash (filepath) {
    const cmdHashResult = await executeCommand(`certUtil -hashFile ${filepath} sha256`);
    const hash = cmdHashResult.split("\n")[1].trim();
    return hash;
}

async function updateUpdatesJSON (version, xpiFilepath, xpiFileHash) {
    let updatesJSON = JSON.parse(await readFile(FILEPATH_UPDATES));
    removePreviousPatchVersions(updatesJSON, version);
    addNewVersion(updatesJSON, version, xpiFilepath, xpiFileHash);
    await writeFile(FILEPATH_UPDATES, stringifyUpdatesJSON(updatesJSON));
}

function removePreviousPatchVersions (updatesJSON, addonVersion) {
    addonVersion = getSemanticVersion(addonVersion);
    updatesJSON.addons[Object.keys(updatesJSON.addons)[0]].updates =
    updatesJSON.addons[Object.keys(updatesJSON.addons)[0]].updates.filter(function (version) {
        const curVersion = getSemanticVersion(version.version);
        if (addonVersion.major === curVersion.major && addonVersion.minor === curVersion.minor) {
            if (addonVersion.patch < curVersion.patch) {
                logError(`There is already a version ${version.version}`);
                return true;
            } else if (addonVersion.patch === curVersion.patch) {
                return false;
            } else {
                deleteXPI(version.version);
                return false;
            }
        }
        return true;
    });
}

function getSemanticVersion (versionString) {
    let [major, minor, patch] = versionString.split(".").map(Number);
    return { major, minor, patch };
}

async function deleteXPI (version) {
    const filepath = await getFilepathOfXPI(version);
    logInfo(`delete ${filepath}`);
    await deleteFile(filepath);
}

function addNewVersion (updatesJSON, addonVersion, xpiFilepath, xpiFileHash) {
    updatesJSON.addons[Object.keys(updatesJSON.addons)[0]].updates.push({
        version: addonVersion,
        update_link: `${URL_UPDATES}/${xpiFilepath}`,
        update_hash: `sha256:${xpiFileHash}`,
    });
}

function stringifyUpdatesJSON (updatesJSON) {
    let str = JSON.stringify(updatesJSON, null, 2);
    str = str.replace(/},\n\s+{/g, "}, {"); // removes linebreaks between objects in an array
    return str;
}

async function updateReadme (version, xpiFilepath) {
    let content = await readFile(FILEPATH_README);
    let badges = `<a href="${URL_UPDATES}/${xpiFilepath}">\n`
        + `<img src="https://img.shields.io/badge/firefox-v${version}-FF7139?logo=mozilla-firefox" alt="Install for Firefox" /></a>\n`
        + `<a href="https://www.mozilla.org/en-US/firefox/new/">\n`
        + `<img src="https://img.shields.io/badge/chrome----4285F4?logo=google-chrome" alt="Not yet available in Chrome Web Store" /></a>`;
    content = content.split(README_BADGE_INSERT_START)[0]
            + README_BADGE_INSERT_START
            + "\n" + badges + "\n"
            + README_BADGE_INSERT_END
            + content.split(README_BADGE_INSERT_END)[1];
    await writeFile(FILEPATH_README, content);
}



async function readFile (filepath) {
    return new Promise(async function (resolve, reject) {
        fs.readFile(filepath, "utf8", function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

async function writeFile (filepath, content) {
    return new Promise(async function (resolve, reject) {
        fs.writeFile(filepath, content, "utf8", function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function deleteFile (filepath) {
    return new Promise(async function (resolve, reject) {
        fs.unlink(filepath, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function executeCommand (command) {
    return new Promise(async function (resolve, reject) {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error.message);
            } else if (stderr) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}


function logError (message) {
    console.log(`${CONSOLE_LOG_COLOR_FG_RED}${message}${CONSOLE_LOG_COLOR_RESET}`);
}
function logInfo (message) {
    console.log(message);
}
function logSuccess (message) {
    console.log(`${CONSOLE_LOG_COLOR_FG_GREEN}${message}${CONSOLE_LOG_COLOR_RESET}`);
}
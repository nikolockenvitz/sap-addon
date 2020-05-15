let usePromisesForAsync = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
}
function execAsync (asyncFunction, args, callback) {
    if (!Array.isArray(args)) args = [args];
    if (usePromisesForAsync) {
        asyncFunction(...args).then(callback);
    } else {
        asyncFunction(...args, callback);
    }
}

let fiorilaunchpad = {
    hostname: "fiorilaunchpad.sap.com",
    overrideLunchmenu: {
        optionName: "fiori-lunchmenu-german",
        configNameLanguage: "config-lunchmenu-language",
        defaultLanguage: "de",
        urls: [
            "https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/webapp/api/client/tiles/*",
            "https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/api/client/lunch*"
        ]
    }
};

let options = {};
let loadOptionsFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        execAsync(browser.storage.local.get, "options", (res) => {
            options = res.options;
            resolve();
        });
    });
};

let isEnabled = function (optionName) {
    return !options || options[optionName] !== false; // enabled per default
};

let config = {};
let loadConfigFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        execAsync(browser.storage.local.get, "config", (res) => {
            config = res.config || {};
            resolve();
        });
    });
};

/* Intercepting AJAX calls which are fetching lunch menu */
fiorilaunchpad.overrideLunchmenu.rewriteLunchMenuHeader = function (requestDetails) {
    const language = config[fiorilaunchpad.overrideLunchmenu.configNameLanguage]
                    || fiorilaunchpad.overrideLunchmenu.defaultLanguage;
    let rewroteHeader = false;
    for (let header of requestDetails.requestHeaders) {
        if (header.name.toLowerCase() === "accept-language") {
            header.value = language;
            rewroteHeader = true;
            break;
        }
    }
    if (!rewroteHeader) {
        requestDetails.requestHeaders.push({
            name: "Accept-Language",
            value: language
        });
    }
    return {requestHeaders: requestDetails.requestHeaders};
};

async function main () {
    await Promise.all([
        loadOptionsFromStorage(),
        loadConfigFromStorage(),
    ]);

    if (isEnabled(fiorilaunchpad.overrideLunchmenu.optionName)) {
        browser.webRequest.onBeforeSendHeaders.addListener(
            fiorilaunchpad.overrideLunchmenu.rewriteLunchMenuHeader,
            { urls: fiorilaunchpad.overrideLunchmenu.urls },
            ["blocking", "requestHeaders"]
        );
    } else {
        browser.webRequest.onBeforeSendHeaders.removeListener(
            fiorilaunchpad.overrideLunchmenu.rewriteLunchMenuHeader
        );
    }
}
main();
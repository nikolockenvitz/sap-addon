let usePromisesForAsync = false;
let isChromium = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
    isChromium = true;
}
function execAsync(asyncFunction, args, callback) {
    if (!Array.isArray(args)) args = [args];
    if (usePromisesForAsync) {
        asyncFunction(...args).then(callback);
    } else {
        asyncFunction(...args, callback);
    }
}

const fiorilaunchpad = {
    hostname: "fiorilaunchpad.sap.com",
    overrideLunchmenu: {
        optionName: "fiori-lunchmenu-german",
        configNameLanguage: "config-lunchmenu-language",
        urls: [
            "https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/webapp/api/client/tiles/*",
            "https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/api/client/lunch*",
        ],
    },
};

let options = {};
function loadOptionsFromStorage() {
    return new Promise(function (resolve) {
        execAsync(browser.storage.local.get.bind(browser.storage.local), "options", (res) => {
            options = res.options;
            resolve();
        });
    });
}

function isEnabled(optionName) {
    return !options || options[optionName] !== false; // enabled per default
}

let config = {};
function loadConfigFromStorage() {
    return new Promise(function (resolve) {
        execAsync(browser.storage.local.get.bind(browser.storage.local), "config", (res) => {
            config = res.config || {};
            resolve();
        });
    });
}

/* Intercepting AJAX calls which are fetching lunch menu */
fiorilaunchpad.overrideLunchmenu.rewriteLunchMenuHeader = function (requestDetails) {
    const language = config[fiorilaunchpad.overrideLunchmenu.configNameLanguage];
    if (!language) return;
    let rewroteHeader = false;
    for (const header of requestDetails.requestHeaders) {
        if (header.name.toLowerCase() === "accept-language") {
            header.value = language;
            rewroteHeader = true;
            break;
        }
    }
    if (!rewroteHeader) {
        requestDetails.requestHeaders.push({
            name: "Accept-Language",
            value: language,
        });
    }
    return { requestHeaders: requestDetails.requestHeaders };
};

async function main() {
    await Promise.all([loadOptionsFromStorage(), loadConfigFromStorage()]);

    if (isEnabled(fiorilaunchpad.overrideLunchmenu.optionName)) {
        const opt_extraInfoSpec = ["blocking", "requestHeaders"];
        if (isChromium) opt_extraInfoSpec.push("extraHeaders");
        browser.webRequest.onBeforeSendHeaders.addListener(
            fiorilaunchpad.overrideLunchmenu.rewriteLunchMenuHeader,
            { urls: fiorilaunchpad.overrideLunchmenu.urls },
            opt_extraInfoSpec
        );
    } else {
        browser.webRequest.onBeforeSendHeaders.removeListener(fiorilaunchpad.overrideLunchmenu.rewriteLunchMenuHeader);
    }
}
main();

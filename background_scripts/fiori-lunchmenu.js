let usePromisesForAsync = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
}

let fiorilaunchpad = {
    hostname: "fiorilaunchpad.sap.com",
    overrideLunchmenu: {
        optionName: "fiori-lunchmenu-german",
        configNameLanguage: "config-lunchmenu-language",
        urls: [
            "https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/webapp/api/client/tiles/*",
            "https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/api/client/lunch*"
        ]
    }
};

let options = {};
let loadOptionsFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        function onLocalStorageGet (res) {
            options = res.options;
            resolve();
        }
        if (usePromisesForAsync) {
            browser.storage.local.get("options").then(onLocalStorageGet);
        } else {
            browser.storage.local.get("options", onLocalStorageGet);
        }
    });
};

let isEnabled = function (optionName) {
    return !options || options[optionName] !== false; // enabled per default
};

let config = {};
let loadConfigFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        function onLocalStorageGet (res) {
            config = res.config;
            resolve();
        }
        if (usePromisesForAsync) {
            browser.storage.local.get("config").then(onLocalStorageGet);
        } else {
            browser.storage.local.get("config", onLocalStorageGet);
        }
    });
};

/* Intercepting AJAX calls which are fetching lunch menu */
fiorilaunchpad.overrideLunchmenu.rewriteLunchMenuHeader = function (requestDetails) {
    requestDetails.requestHeaders.forEach(function(header){
        if (header.name.toLowerCase() === "accept-language") {
            header.value = config[fiorilaunchpad.overrideLunchmenu.configNameLanguage] || "de";
          }
    });
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
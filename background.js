let usePromisesForAsync = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
}

let sap = {
    fiorilaunchpad: {
        hostname: "fiorilaunchpad.sap.com",
        lunchmenuGerman: {
            optionName: "fiori-lunchmenu-german",
            urls: [
                "https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/webapp/api/client/tiles/*",
                "https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/api/client/lunch*"
            ]
        }
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


/* Intercepting AJAX calls which are fetching lunch menu */
sap.fiorilaunchpad.lunchmenuGerman.rewriteLunchMenuHeader = function (requestDetails) {
    requestDetails.requestHeaders.forEach(function(header){
        if (header.name.toLowerCase() === "accept-language") {
            header.value = "de";
          }
    });
    return {requestHeaders: requestDetails.requestHeaders};
};

async function main () {
    await loadOptionsFromStorage();

    if (isEnabled(sap.fiorilaunchpad.lunchmenuGerman.optionName)) {
        browser.webRequest.onBeforeSendHeaders.addListener(
            sap.fiorilaunchpad.lunchmenuGerman.rewriteLunchMenuHeader,
            { urls: sap.fiorilaunchpad.lunchmenuGerman.urls },
            ["blocking", "requestHeaders"]
        );
    } else {
        browser.webRequest.onBeforeSendHeaders.removeListener(
            sap.fiorilaunchpad.lunchmenuGerman.rewriteLunchMenuHeader
        );
    }
}
main();
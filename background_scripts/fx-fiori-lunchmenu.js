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
let config = {};

/* Intercepting AJAX calls which are fetching lunch menu */
function rewriteLunchMenuHeader(requestDetails) {
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
}

async function main() {
    [options, config] = await Promise.all([loadFromStorage("options"), loadFromStorage("config")]);

    // remove potential previous listeners
    browser.webRequest.onBeforeSendHeaders.removeListener(rewriteLunchMenuHeader);

    if (isEnabled(fiorilaunchpad.overrideLunchmenu.optionName)) {
        const opt_extraInfoSpec = ["blocking", "requestHeaders"];
        if (isChromium) opt_extraInfoSpec.push("extraHeaders");
        browser.webRequest.onBeforeSendHeaders.addListener(
            rewriteLunchMenuHeader,
            { urls: fiorilaunchpad.overrideLunchmenu.urls },
            opt_extraInfoSpec
        );
    }
}
main();

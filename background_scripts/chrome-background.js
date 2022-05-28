// import { fetchUsername } from "./fetch-github-name.js";
// import { test } from "./declarative-net-request.js";
try {
    importScripts("./fetch-github-name.js", "./chrome-fiori-lunchmenu.js");
} catch (e) {
    console.error(e);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.contentScriptQuery === "githubFetchUsername") {
        const resultPromise = fetchUsername(...request.args);
        resultPromise.then((username) => sendResponse(username));
        return true;
    }
    if (request.rerunMainFunctionOfBackgroundPage) {
        const { config, options } = request;
        fioriLunchmenuUpdateDeclarativeNetRequest({ config, options });
    }
});

async function onTabActivated() {
    const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
    for (const tab of tabs) {
        // connect will trigger main function of content scripts
        chrome.tabs.connect(tab.id).disconnect();
    }
}
chrome.tabs.onActivated.addListener(onTabActivated);

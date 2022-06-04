try {
    importScripts(
        "./fetch-github-name.js",
        "./chrome-fiori-lunchmenu.js",
        "../shared/dynamic-content-scripts-config.js",
        "./chrome-permission-manager.js"
    );
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

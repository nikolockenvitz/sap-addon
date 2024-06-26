try {
    importScripts(
        "./fetch-github-name.js",
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
});

async function onTabActivated() {
    const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
    for (const tab of tabs) {
        // connect will trigger main function of content scripts
        chrome.tabs.connect(tab.id).disconnect();
    }
}
chrome.tabs.onActivated.addListener(onTabActivated);

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.contentScriptQuery === "githubFetchUsername") {
        const resultPromise = fetchUsername(...request.args);
        if (usePromisesForAsync) {
            return resultPromise;
        } else {
            // chrome requires to use the legacy version :(
            resultPromise.then((username) => sendResponse(username));
            return true;
        }
    }
    if (request.rerunMainFunctionOfBackgroundPage) {
        main();
    }
});

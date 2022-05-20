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
});

function fetchUsername(userId, hostnameGithub, regexNameOnProfilePageGithub) {
    return new Promise(async function (resolve) {
        const fetchURL = "https://" + hostnameGithub + "/" + userId;
        try {
            const html = await (
                await fetch(fetchURL, {
                    method: "GET",
                })
            ).text();
            const searchRegex = new RegExp(regexNameOnProfilePageGithub);
            const match = (searchRegex.exec(html)[1] || "").trim();
            const name = decodeHtml(match);
            resolve(name);
        } catch (error) {
            logFetchError(userId, fetchURL, error);
            resolve(null);
        }
    });
}

function logFetchError(userId, url, error) {
    if (new RegExp(`[di]\\d{6}|c\\d{7}`, "i").exec(userId)) {
        // only logs error when it looks like a correct userId
        // either d/D/i/I + 6 numbers or c/C + 7 numbers
        console.log("SAP Addon - Error when fetching", url, error);
    }
}

function decodeHtml(html) {
    // https://stackoverflow.com/a/7394787
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

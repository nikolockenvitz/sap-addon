/* initial setup for browser and promises only needs to be done in first
 * background script
 */

browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery === "githubFetchUsername") {
            const resultPromise = fetchUsername(...request.args);
            if (usePromisesForAsync) {
                return resultPromise;
            } else { // chrome requires to use the legacy version :(
                resultPromise.then(username => sendResponse(username));
                return true;
            }
        }
    }
);

function fetchUsername (userId, isGetNamesFromPeopleEnabled, hostnamePeople, regexNameOnProfilePagePeople,
    hostnameGithub, regexNameOnProfilePageGithub
) {
    return new Promise(async function (resolve) {
        let fetchURL;
        if (isGetNamesFromPeopleEnabled) {
            fetchURL = "https://" + hostnamePeople + "/profiles/" + userId;
            try {
                const html = await (await fetch(fetchURL, {
                    method: "GET",
                    cache: "force-cache"
                })).text();
                const searchRegex = new RegExp(regexNameOnProfilePagePeople);
                let match = searchRegex.exec(html)[1];
                /* currently the salutation is not in the span which is named
                 * salutation but direclty in front of the name -> we need
                 * to split that away
                 * e.g.: <span class='salutation'></span>Mr. Firstname Lastname
                 */
                match = match.split(". ").pop().trim();
                return resolve(match);
            } catch (error) {
                logFetchError(userId, fetchURL, error);
            }
        }

        // use github as fallback or if people is disabled
        fetchURL = "https://" + hostnameGithub + "/" + userId;
        try {
            const html = await (await fetch(fetchURL, {
                method: "GET",
                cache: "force-cache"
            })).text();
            const searchRegex = new RegExp(regexNameOnProfilePageGithub);
            const match = searchRegex.exec(html)[1];
            resolve(match);
        } catch (error) {
            logFetchError(userId, fetchURL, error);
            resolve(null);
        }
    });
}

function logFetchError (userId, url, error) {
    if ((new RegExp(`[di]\\d{6}|c\\d{7}`, "i")).exec(userId)) {
        // only logs error when it looks like a correct userId
        // either d/D/i/I + 6 numbers or c/C + 7 numbers
        console.log("SAP Addon - Error when fetching", url, error);
    }
}

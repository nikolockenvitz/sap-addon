function fetchUsername(userId, hostnameGithub, regexNameOnProfilePageGithub) {
    return new Promise(async function (resolve) {
        const fetchURL = "https://" + hostnameGithub + "/" + userId;
        try {
            const html = await (await fetch(fetchURL)).text();
            const searchRegex = new RegExp(regexNameOnProfilePageGithub);
            const match = (searchRegex.exec(html)[1] || "").trim();
            resolve(match);
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

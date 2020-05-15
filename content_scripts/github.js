let usePromisesForAsync = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
}
function execAsync (asyncFunction, args, callback) {
    if (!Array.isArray(args)) args = [args];
    if (usePromisesForAsync) {
        asyncFunction(...args).then(callback);
    } else {
        asyncFunction(...args, callback);
    }
}
let url = new URL(window.location.href);

let github = {
    signIn: {
        optionName: "github-sign-in",
        query: "a[href^='/login?']",
        signInOtherTabQuery: ".js-stale-session-flash-signed-in a",
    },
    flashNotice: {
        optionName: "github-hide-notice",
        query: ".flash.flash-full.js-notice.flash-warn.flash-length-limited",
    },
    showNames: {
        optionName: "github-show-names",
        query: `.user-mention,
            [data-hovercard-type=user],
            a.text-emphasized.link-gray-dark,
            .merge-status-item.review-item.bg-white.js-details-container.Details strong.text-emphasized,
            small a.text-gray-dark`,
        queryEmojiReactions: `div.comment-reactions-options button.btn-link.reaction-summary-item.tooltipped[type=submit]`,
        regexNameOnProfilePage: `<span class="p-name vcard-fullname d-block overflow-hidden" itemprop="name">([^<]*)</span>`,
    },
    getNamesFromPeople: {
        optionName: "github-get-names-from-people",
        hostname: "people.wdf.sap.corp",
        regexNameOnProfilePage: `<span class='salutation'>[^<]*</span>([^<]*)<`,
    },
};

class DOMObserver {
    constructor () {
        this.observerCallbacks = {};
        let that = this;
        this.observer = new MutationObserver(function (mutation, _observer) {
            for (let id in that.observerCallbacks) {
                that.observerCallbacks[id](mutation, _observer);
            }
        });
        this.observer.observe(document, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    registerCallbackFunction (id, callback) {
        if (!this.observerCallbacks[id]) {
            this.observerCallbacks[id] = callback;
        }
    }

    unregisterCallbackFunction (id) {
        delete this.observerCallbacks[id];
    }
}
const domObserver = new DOMObserver();

github.signIn.signIn = function () {
    executeFunctionAfterPageLoaded(function () {
        github.signIn.getSignInButtonAndClick();
    });

    domObserver.registerCallbackFunction(github.signIn.optionName,
    function (mutations, _observer) {
        for (let { target } of mutations) {
            github.signIn.getSignInButtonAndClick(target);
        }
    });
};
github.signIn.getSignInButtonAndClick = function (element) {
    element = element || document;
    try {
        let signInBtn = element.querySelector(github.signIn.query);
        if (signInBtn && signInBtn.click) {
            setTimeout(function () {
                signInBtn.click();
            }, 100); // when click is executed directly, github.tools.sap crashes in chrome
            github.signIn.stopAutoSignIn();
        }
    } catch {}
};
github.signIn.stopAutoSignIn = function () {
    domObserver.unregisterCallbackFunction(github.signIn.optionName);
};
github.signIn.listenForSignInOtherTab = function () {
    /* when also non-active tabs are notified that settings changed and user
     * should get signed in, these tabs will be redirected to
     * github.wdf.sap.corp/saml/consume which throws a 404
     * -> only regularly checking works, maybe can be combined with mutation observer
     */
    setInterval(async function () {
        await loadOptionsFromStorage();
        if (isEnabled(github.signIn.optionName)) {
            let signInBtn = document.querySelector(github.signIn.signInOtherTabQuery);
            if (signInBtn) {
                let r = signInBtn.getBoundingClientRect();
                if (r.width !== 0 && r.height !== 0) {
                    signInBtn.click();
                }
            }
        }
    }, 2500);
};

github.flashNotice.hide = function () {
    executeFunctionAfterPageLoaded(function () {
        _hideElementsByQuery(github.flashNotice.query);
    });

    domObserver.registerCallbackFunction(github.flashNotice.optionName,
    function (mutations, _observer) {
        for (let { target } of mutations) {
            _hideElementsByQuery(github.flashNotice.query, target);
        }
    });
};

github.flashNotice.show = function () {
    domObserver.unregisterCallbackFunction(github.flashNotice.optionName);
    executeFunctionAfterPageLoaded(function () {
        _showElementsByQuery(github.flashNotice.query);
    });
};

let _hideElementsByQuery = function (query, baseElement) {
    _setDisplayAttributeForElementsByQuery(query, baseElement, "none");
};

let _showElementsByQuery = function (query, baseElement) {
    _setDisplayAttributeForElementsByQuery(query, baseElement, "");
};

let _setDisplayAttributeForElementsByQuery = function (query, baseElement, displayValue) {
    baseElement = baseElement || document;
    try {
        for (let element of baseElement.querySelectorAll(query)) {
            element.style.display = displayValue;
        }
    } catch {}
};

github.showNames.replaceIds = function () {
    executeFunctionAfterPageLoaded(function () {
        /* execute once in cases where observer is not registered before
         * elements are changed/created (e.g. gets enabled in options)
         */
        github.showNames._replaceAllChildsWhichAreUserId(document.body);
        saveUsernameCacheToStorage();
    });

    domObserver.registerCallbackFunction(github.showNames.optionName,
    function (mutations, _observer) {
        for (let { target } of mutations) {
            github.showNames._replaceAllChildsWhichAreUserId(target);
        }
        saveUsernameCacheToStorage();
    });
};
github.showNames.showIdsAgain = function () {
    domObserver.unregisterCallbackFunction(github.showNames.optionName);
    for (let element of document.querySelectorAll("[data-sap-addon-user-id]")) {
        element.textContent = element.getAttribute("data-sap-addon-user-id");
        element.removeAttribute("data-sap-addon-user-id");
    }
    for (let element of document.querySelectorAll("[data-sap-addon-tooltip-original-content]")) {
        element.setAttribute("aria-label", element.getAttribute("data-sap-addon-tooltip-original-content"));
        element.removeAttribute("data-sap-addon-tooltip-original-content");
    }
};
github.showNames._replaceAllChildsWhichAreUserId = function (element) {
    try {
        for (let queryMatch of element.querySelectorAll(github.showNames.query)) {
            github.showNames._replaceElementIfUserId(queryMatch);
        }
    } catch {}
    try {
        for (let queryMatch of element.querySelectorAll(github.showNames.queryEmojiReactions)) {
            github.showNames._replaceElementsTooltip(queryMatch);
        }
    } catch {}
};
github.showNames._replaceElementIfUserId = async function (element) {
    const {userId, prefix} = github.showNames._getUserIdIfElementIsUserId(element);
    if (userId) {
        let username = await github.showNames._getUsername(userId);
        if (username) {
            let el = getDirectParentOfText(element, prefix + userId);
            if (el) {
                el.textContent = prefix + username;
                el.setAttribute("data-sap-addon-user-id", prefix + userId);
            }
        }
    }
};
github.showNames._getUserIdIfElementIsUserId = function (element) {
    let userId = (!element.hasAttribute("data-sap-addon-user-id")
            && !element.querySelector("[data-sap-addon-user-id]"))
            ? element.textContent.trim() : null;
    if (userId === "" || !isElementALink(element)) {
        if (!github.showNames._hrefExceptionForReviewer(element)) {
            userId = null;
        }
    }
    if (userId && element.classList.contains("user-mention") && userId.startsWith("@")) {
        return { prefix: "@", userId: userId.substr(1) };
    }
    return { prefix: "", userId };
};

github.showNames._replaceElementsTooltip = async function (element) {
    if (element.hasAttribute("data-sap-addon-tooltip-original-content")) {
        return; // already replaced
    }
    let originalTooltipText = element.getAttribute("aria-label");
    let replacedTooltipText = await github.showNames._getNewTooltipText(originalTooltipText);
    element.setAttribute("data-sap-addon-tooltip-original-content", originalTooltipText);
    element.setAttribute("aria-label", replacedTooltipText);
};
github.showNames._getNewTooltipText = async function (originalTooltipText) {
    // text: (A | A and B | A, B, and C) reacted with ... emoji
    // TODO: more than three?
    const tooltipSeparator = " reacted with ";
    let [userIds, emoji] = splitAtLast(originalTooltipText, tooltipSeparator);
    let usernames = [];
    if (userIds.includes(", and ")) { // more than two names
        let [firstUserIds, lastUserId] = userIds.splitAtLast(", and ");
        for (let userId of firstUserIds) {
            usernames.push(await github.showNames._getUsername(userId));
        }
        usernames.push(await github.showNames._getUsername(lastUserId));
    } else if (userIds.includes(" and ")) { // two names
        for (let userId of userIds.split(" and ")) {
            usernames.push(await github.showNames._getUsername(userId));
        }
    } else { // one name
        usernames.push(await github.showNames._getUsername(userIds));
    }
    return github.showNames._makeUsernameTextForTooltip(usernames) + tooltipSeparator + emoji;
};
github.showNames._makeUsernameTextForTooltip = function (usernames) {
    let usernameText = "";
    for (let i=0; i<usernames.length; i++) {
        if (i !== 0 && usernames.length !== 2) {
            usernameText += ", ";
        }
        if (i === usernames.length-1) {
            if (i === 0) {
                // only one username, no "and" needed
            } else if (i === 1) {
                usernameText += " and ";
            } else {
                // if more than two usernames there will already be a ", " (including a space)
                usernameText += "and ";
            }
        }
        usernameText += usernames[i];
    }
    return usernameText;
};

github.showNames._getUsername = async function (userId) {
    let user = usernameCache[userId];
    if (user && user.username) {
        usernameCache[userId].usedAt = getUnixTimestamp();
        usernameCache[userId].used += 1;
        return user.username;
    } else {
        let username = await github.showNames._fetchUsername(userId);
        if (username) {
            usernameCache[userId] = {
                username: username,
                updatedAt: getUnixTimestamp(),
                usedAt: getUnixTimestamp(),
                used: 1,
            };
        }
        return username;
    }
};

github.showNames._fetchUsername = function (userId) {
    return new Promise(async function (resolve, reject) {
        let fetchURL;
        if (isEnabled(github.getNamesFromPeople.optionName)) {
            fetchURL = "https://" + github.getNamesFromPeople.hostname + "/profiles/" + userId;
            fetch(fetchURL, {
                method: "GET",
                cache: "force-cache"
            }).then(response => response.text())
            .then(html => {
                const searchRegex = new RegExp(github.getNamesFromPeople.regexNameOnProfilePage);
                let match = searchRegex.exec(html)[1];
                /* currently the salutation is not in the span which is named
                 * salutation but direclty in front of the name -> we need
                 * to split that away
                 * e.g.: <span class='salutation'></span>Mr. Firstname Lastname
                 */
                match = match.split(". ").pop().trim();
                resolve(match);
            }).catch(error => {
                github.showNames._logFetchError(userId, fetchURL, error);
            });
        }

        // use github as fallback or if people is disabled
        fetchURL = "https://" + url.hostname + "/" + userId;
        fetch(fetchURL, {
            method: "GET",
            cache: "force-cache"
        }).then(response => response.text())
        .then(html => {
            const searchRegex = new RegExp(github.showNames.regexNameOnProfilePage);
            const match = searchRegex.exec(html)[1];
            resolve(match);
        }).catch(error => {
            github.showNames._logFetchError(userId, fetchURL, error);
            resolve(null); // reject?
        });
    });
};

github.showNames._logFetchError = function (userId, url, error) {
    if ((new RegExp(`[di]\d{6}|c\d{7}`, "i")).exec(userId)) {
        // only logs error when it looks like a correct userId
        // either d/D/i/I + 6 numbers or c/C + 7 numbers
        console.log("SAP Addon - Error when fetching", url, error);
    }
};

github.showNames._hrefExceptionForReviewer = function (element) {
    // reviewer (approval / pending) don't have a link to the user -> therefore exception needs to be added
    if (element.classList.contains("text-emphasized")
        && element.parentElement
        && element.parentElement.parentElement
        && element.parentElement.parentElement.querySelector("[data-hovercard-type=user]")) {
        return true;
    }
};



let getUnixTimestamp = function () {
    return Math.floor((new Date()).getTime());
};

let isElementALink = function (element) {
    // check childs
    for (let linkChild of element.querySelectorAll("[href]")) {
        if (linkChild && element.textContent.trim() === linkChild.textContent.trim()) {
            return true;
        }
    }
    // check parents
    while (true) {
        if (!element) return false;
        if (element.hasAttribute("href")) return true;
        element = element.parentElement;
    }
};

let getDirectParentOfText = function (baseElement, text) {
    if (baseElement.childNodes.length === 1
        && baseElement.firstChild.nodeName === "#text"
        && baseElement.textContent.trim() === text) {
        return baseElement;
    } else {
        for (let child of baseElement.childNodes) {
            if (child.childNodes.length > 0) {
                let r = getDirectParentOfText(child, text);
                if (r) {
                    return r;
                }
            }
        }
    }
};

let splitAtLast = function (text, separator) {
    let temp = text.split(separator);
    let last = temp.pop();
    return [temp.join(separator), last];
};


let redirectToURL = function (url) {
    window.location.replace(url);
};

let executeFunctionAfterPageLoaded = function (func, args=[]) {
    window.addEventListener("load", (e) => {
        func(...args);
    });
    if (document.readyState === "complete") {
        func(...args);
    }
};

let options = {};
let loadOptionsFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        execAsync(browser.storage.local.get, "options", (res) => {
            options = res.options || {};
            resolve();
        });
    });
};

let isEnabled = function (optionName) {
    return !options || options[optionName] !== false; // enabled per default
};

let usernameCache = undefined;
let loadUsernameCacheFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        execAsync(browser.storage.local.get, "usernameCache", (res) => {
            usernameCache = res.usernameCache || {};
            resolve();
        });
    });
};

let saveUsernameCacheToStorage = function () {
    browser.storage.local.set({usernameCache: usernameCache});
};

async function main () {
    await Promise.all([
        loadUsernameCacheFromStorage(),
        loadOptionsFromStorage(),
    ]);

    if (isEnabled(github.signIn.optionName)) {
        github.signIn.signIn();
    } else {
        github.signIn.stopAutoSignIn();
    }
    github.signIn.listenForSignInOtherTab();
    if (isEnabled(github.flashNotice.optionName)) {
        github.flashNotice.hide();
    } else {
        github.flashNotice.show();
    }
    if (isEnabled(github.showNames.optionName)) {
        github.showNames.replaceIds();
    } else {
        github.showNames.showIdsAgain();
    }
};
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

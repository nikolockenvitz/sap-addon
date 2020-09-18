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
            small a.text-gray-dark,
            span.js-comment-edit-history details summary div span,
            span.js-comment-edit-history details details-menu.dropdown-menu.js-comment-edit-history-menu
                ul li button.btn-link span.css-truncate-target.v-align-middle.text-bold,
            details.details-overlay details-dialog div div div span.css-truncate-target.v-align-middle.text-bold.text-small
        `,
        queryEmojiReactions: `div.comment-reactions-options button.btn-link.reaction-summary-item.tooltipped[type=submit]`,
        regexNameOnProfilePage: `<span class="p-name vcard-fullname d-block overflow-hidden" itemprop="name">([^<]*)</span>`,
        userIdFalsePositives: [ "edited" ],
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

        // there's a redirect during login; in case redirects are blocked by the browser: click link
        const redirectLink = github.signIn.getSignInRedirectLink(element);
        if (redirectLink && redirectLink.click) {
            redirectLink.click();
            github.signIn.stopAutoSignIn();
        }
    } catch {}
};
github.signIn.getSignInRedirectLink = function (element) {
    const redirectLink = element.querySelector("a#redirect[href^='https://accounts.sap.com/']");
    return (redirectLink && url.pathname === "/login") ? redirectLink : null;
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
        if (!github.showNames._hrefExceptionForReviewer(element) &&
            !github.showNames._hrefExceptionForCommentEditHistoryDialog(element)
        ) {
            userId = null;
        }
    }
    if (userId) {
        for (const possiblePrefix of [
            { prefix: "@", furtherChecks: element.classList.contains("user-mention") },
            { prefix: "edited by " },
        ]) {
            if (userId.startsWith(possiblePrefix.prefix) &&
                (!("furtherChecks" in possiblePrefix) || possiblePrefix.furtherChecks)
            ) {
                return {
                    prefix: possiblePrefix.prefix,
                    userId: userId.substr(possiblePrefix.prefix.length),
                };
            }
        }
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
    const tooltipSeparator = " reacted with ";
    let [userIds, emoji] = splitAtLast(originalTooltipText, tooltipSeparator);
    let usernames = [];
    if (userIds.includes(", and ")) { // more than two names
        let [firstUserIds, lastUserId] = splitAtLast(userIds, ", and ");
        for (let userId of firstUserIds.split(", ")) {
            usernames.push(await github.showNames._getUsername(userId));
        }
        // lastUserId should not match something like "5 more" (e.g. in A, ..., B, and 5 more)
        if (!(new RegExp(`\\d+ more`)).exec(lastUserId)) {
            usernames.push(await github.showNames._getUsername(lastUserId));
        }
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

/* The request queue will store an array for each userId that should be retrieved from People/GitHub.
This array is to avoid multiple requests when a userId is requested multiple times (so that only
one request is made in the end). All waiting "observers" will be notified once the first call
received a username. When a username has been retrieved and is stored in the cache this queue is no
longer needed; it's only for the first time when _getUsername is called simultaniously multiple times
and there's no username in the cache yet.
*/
const userIdRequestQueue = {};

github.showNames._getUsername = async function (userId) {
    if (github.showNames.userIdFalsePositives.includes(userId)) return null;
    let user = usernameCache[userId];
    if (user && user.username) {
        usernameCache[userId].usedAt = getUnixTimestamp();
        usernameCache[userId].used += 1;
        return user.username;
    } else if (userId in userIdRequestQueue) {
        return new Promise((resolve) => {
            userIdRequestQueue[userId].push(function (username) {
                if (username) {
                    usernameCache[userId].usedAt = getUnixTimestamp();
                    usernameCache[userId].used += 1;
                }
                resolve(username);
            });
        });
    } else {
        userIdRequestQueue[userId] = [];
        let username = await github.showNames._fetchUsername(userId);
        if (username) {
            usernameCache[userId] = {
                username: username,
                updatedAt: getUnixTimestamp(),
                usedAt: getUnixTimestamp(),
                used: 1,
            };
        }
        const observers = userIdRequestQueue[userId];
        delete userIdRequestQueue[userId];
        for (const notify of observers) { notify(username); }
        return username;
    }
};

github.showNames._fetchUsername = function (userId) {
    return new Promise(function (resolve) {
        execAsync(browser.runtime.sendMessage.bind(browser.runtime), {
            contentScriptQuery: "githubFetchUsername",
            args: [ userId, isEnabled(github.getNamesFromPeople.optionName), github.getNamesFromPeople.hostname,
                github.getNamesFromPeople.regexNameOnProfilePage, url.hostname, github.showNames.regexNameOnProfilePage ]
        }, (username) => {
            resolve(username);
        });
    });
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
github.showNames._hrefExceptionForCommentEditHistoryDialog = function (element) {
    // dialog which displays comment edit history doesn't has a link to the user
    return element.matches(`details.details-overlay details-dialog div div div
        span.css-truncate-target.v-align-middle.text-bold.text-small`); // same query string as in github.showNames.query
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
        if (element.classList.contains("btn-link") &&
            (element.tagName.toLowerCase() === "button" ||
             (element.tagName.toLowerCase() === "summary" && element.getAttribute("role") === "button")
            )
        ) {
            return true;
        }
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
        execAsync(browser.storage.local.get.bind(browser.storage.local), "options", (res) => {
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
        execAsync(browser.storage.local.get.bind(browser.storage.local), "usernameCache", (res) => {
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

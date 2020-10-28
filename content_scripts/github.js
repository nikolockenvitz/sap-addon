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
        optionName: "github-hide-notice-overlay",
        query: ".flash.flash-full.js-notice.flash-warn.flash-length-limited",
    },
    showNames: {
        optionName: "github-show-names",
        query: `.user-mention,
            [data-hovercard-type=user],
            a.text-emphasized.link-gray-dark,
            .merge-status-item.review-item.bg-white.js-details-container.Details strong.text-emphasized,
            small a.text-gray-dark,
            div.js-recent-activity-container div.Box ul li.Box-row div.dashboard-break-word.lh-condensed.text-gray span.text-gray,
            span.js-comment-edit-history details summary div span,
            span.js-comment-edit-history details details-menu.dropdown-menu.js-comment-edit-history-menu
                ul li button.btn-link span.css-truncate-target.v-align-middle.text-bold,
            details.details-overlay details-dialog div div div span.css-truncate-target.v-align-middle.text-bold.text-small,
            form.js-resolvable-timeline-thread-form strong,
            div.js-resolvable-timeline-thread-container div.comment-holder.js-line-comments div.js-resolvable-thread-toggler-container strong
        `,
        queryTooltips: `div.comment-reactions-options button.btn-link.reaction-summary-item.tooltipped[type=submit],
            div.AvatarStack div.AvatarStack-body.tooltipped`,
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

github.flashNotice.hideDismissedNoticeBoxesAndInsertHideOverlayIfEnabled = function (insertOverlayEnabled=false) {
    function getTextOfNoticeBox (noticeBox) {
        let text = `${url.host} `;
        for (const containers of noticeBox.children) {
            for (const el of containers.children) {
                if (!el.classList.contains("sap-addon-hide-notice-box-overlay")) {
                    text += el.textContent;
                }
            }
        }
        return text;
    }
    function hideIfMessageIsSetToHidden (noticeBox) {
        if (getTextOfNoticeBox(noticeBox) in noticeBoxMessagesToHide) {
            noticeBox.style.display = "none";
        }
    }
    function clearOldNoticeBoxMessages () {
        const _90_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
        const now = getUnixTimestamp();
        for (const message in noticeBoxMessagesToHide) {
            const { dismissedAt } = noticeBoxMessagesToHide[message];
            if (now - dismissedAt > _90_DAYS_IN_MS) {
                delete noticeBoxMessagesToHide[message];
            }
        }
    }
    function insertOverlay (noticeBox) {
        if (!insertOverlayEnabled) return;
        if (noticeBox.hasAttribute("data-sap-addon-notice-box-inserted-overlay")) return;
        noticeBox.setAttribute("data-sap-addon-notice-box-inserted-overlay", "true");
        const container = noticeBox.children[noticeBox.children.length - 1];
        const overlay = document.createElement("p");
        overlay.classList.add("sap-addon-hide-notice-box-overlay");
        overlay.style = "text-align: right; font-size: 90%;";
        overlay.innerHTML = `SAP Addon:
        <a tabindex="0" style="cursor: pointer" data-sap-addon-link="hide-message">Don't show this message again</a> |
        <a tabindex="0" style="cursor: pointer" data-sap-addon-link="hide-once">Hide once</a>
        `;
        for (const link of overlay.querySelectorAll("a[data-sap-addon-link]")) {
            function listener (event) {
                const action = link.getAttribute("data-sap-addon-link");
                if (action === "hide-once") {
                    noticeBox.style.display = "none";
                } else if (action === "hide-message") {
                    noticeBoxMessagesToHide[getTextOfNoticeBox(noticeBox)] = {
                        dismissedAt: getUnixTimestamp(),
                    };
                    clearOldNoticeBoxMessages();
                    saveNoticeBoxMessagesToHideToStorage();
                    noticeBox.style.display = "none";
                }
            }
            link.addEventListener("click", listener);
            link.addEventListener("keyup", (event) => event.keyCode === 13 ? listener(event) : null);
        }
        container.appendChild(overlay);
    }

    executeFunctionAfterPageLoaded(function () {
        for (const match of document.querySelectorAll(github.flashNotice.query)) {
            hideIfMessageIsSetToHidden(match);
            insertOverlay(match);
        }
    });

    _showElementsByQuery(`[data-sap-addon-notice-box-inserted-overlay] .sap-addon-hide-notice-box-overlay`);

    domObserver.registerCallbackFunction(github.flashNotice.optionName,
    function (mutations, _observer) {
        for (let { target } of mutations) {
            for (const match of target.querySelectorAll(github.flashNotice.query)) {
                hideIfMessageIsSetToHidden(match);
                insertOverlay(match);
            }
        }
    });
};
github.flashNotice.removeHideOverlay = function () {
    _hideElementsByQuery(`[data-sap-addon-notice-box-inserted-overlay] .sap-addon-hide-notice-box-overlay`);
};
github.flashNotice.showAllAgain = function () {
    for (const message in noticeBoxMessagesToHide) {
        delete noticeBoxMessagesToHide[message];
    }
    saveNoticeBoxMessagesToHideToStorage();

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
        for (let queryMatch of element.querySelectorAll(github.showNames.queryTooltips)) {
            github.showNames._replaceElementsTooltip(queryMatch);
        }
    } catch {}
};
github.showNames._replaceElementIfUserId = async function (element) {
    const {userId, prefix, suffix} = github.showNames._getUserIdIfElementIsUserId(element);
    if (userId) {
        if (element.hasAttribute("data-sap-addon-already-getting-username")) return;
        element.setAttribute("data-sap-addon-already-getting-username", "true");

        let username = await github.showNames._getUsername(userId);
        if (username) {
            let el = getDirectParentOfText(element, prefix + userId + suffix);
            if (el) {
                el.textContent = prefix + username + suffix;
                el.setAttribute("data-sap-addon-user-id", prefix + userId + suffix);
            }
        }
        element.removeAttribute("data-sap-addon-already-getting-username");
    }
};
github.showNames._getUserIdIfElementIsUserId = function (element) {
    let userId = (!element.hasAttribute("data-sap-addon-user-id")
            && !element.querySelector("[data-sap-addon-user-id]"))
            ? element.textContent.trim() : null;
    if (userId === "" || !isElementALink(element)) {
        if (!github.showNames._hrefException(element)) {
            userId = null;
        }
    }
    if (userId) {
        for (const possiblePrefixOrSuffix of [
            { prefix: "@", furtherChecks: element.classList.contains("user-mention") },
            { prefix: "edited by " },
            { suffix: " commented" },
        ]) {
            if ((possiblePrefixOrSuffix.prefix && userId.startsWith(possiblePrefixOrSuffix.prefix) ||
                 possiblePrefixOrSuffix.suffix && userId.endsWith(possiblePrefixOrSuffix.suffix)) &&
                (!("furtherChecks" in possiblePrefixOrSuffix) || possiblePrefixOrSuffix.furtherChecks)
            ) {
                return {
                    prefix: possiblePrefixOrSuffix.prefix || "",
                    userId: userId.substring(
                        (possiblePrefixOrSuffix.prefix || "").length,
                        userId.length - (possiblePrefixOrSuffix.suffix || "").length),
                    suffix: possiblePrefixOrSuffix.suffix || "",
                };
            }
        }
    }
    return { prefix: "", userId, suffix: "" };
};
github.showNames._hrefException = function (element) {
    return (
        github.showNames._hrefExceptionForReviewer(element) ||
        github.showNames._hrefExceptionForCommentEditHistoryDialog(element) ||
        github.showNames._hrefExceptionForResolvedConversation(element) ||
        github.showNames._hrefExceptionForResolvedConversationPrReview(element) ||
        github.showNames._hrefExceptionForRecentActivity(element)
    );
}

github.showNames._replaceElementsTooltip = async function (element) {
    if (element.hasAttribute("data-sap-addon-tooltip-original-content") ||
        element.hasAttribute("data-sap-addon-already-replacing-tooltip")
    ) {
        return; // already replaced
    }
    element.setAttribute("data-sap-addon-already-replacing-tooltip", "true");
    let originalTooltipText = element.getAttribute("aria-label");
    let replacedTooltipText = await github.showNames._getNewTooltipText(originalTooltipText);
    element.setAttribute("data-sap-addon-tooltip-original-content", originalTooltipText);
    element.removeAttribute("data-sap-addon-already-replacing-tooltip");
    element.setAttribute("aria-label", replacedTooltipText);
};
github.showNames._getNewTooltipText = async function (originalTooltipText) {
    // currently supports: emoji reactions, project issues cards
    // (A | A and B | A, B, and C) reacted with ... emoji
    // Assigned to (A | A and B | A, B, and C)
    const tooltipTypes = [
        { textAfterUserIds: " reacted with " },
        { textBeforeUserIds: "Assigned to " },
    ];
    let currentTooltipType;
    for (const tooltipType of tooltipTypes) {
        if ((!tooltipType.textBeforeUserIds || originalTooltipText.includes(tooltipType.textBeforeUserIds)) &&
            (!tooltipType.textAfterUserIds || originalTooltipText.includes(tooltipType.textAfterUserIds))
        ) {
            currentTooltipType = tooltipType;
            break;
        }
    }
    if (!currentTooltipType) return;

    // split tooltip text which has following structure: "<textBefore><textBeforeUserIds><userIds><textAfterUserIds><textAfter>"
    let userIds;
    let textBefore = textAfter = tempSplitResultAtTextBeforeUserIds = "";
    if (currentTooltipType.textBeforeUserIds) {
        [textBefore, tempSplitResultAtTextBeforeUserIds] = originalTooltipText.split(currentTooltipType.textBeforeUserIds);
        userIds = tempSplitResultAtTextBeforeUserIds;
    }
    if (currentTooltipType.textAfterUserIds) {
        [userIds, textAfter] = (tempSplitResultAtTextBeforeUserIds || originalTooltipText).split(currentTooltipType.textAfterUserIds);
    }

    let usernames = [];
    if (userIds.includes(", and ")) { // more than two names
        let [firstUserIds, lastUserId] = userIds.split(", and ");
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
    return (
        textBefore +
        (currentTooltipType.textBeforeUserIds || "") +
        github.showNames._makeUsernameTextForTooltip(usernames) +
        (currentTooltipType.textAfterUserIds || "") +
        textAfter
    );
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
github.showNames._hrefExceptionForResolvedConversation = function (element) {
    return (
        element.parentElement &&
        element.parentElement.tagName === "FORM" &&
        element.parentElement.classList.contains("js-resolvable-timeline-thread-form")
    );
};
github.showNames._hrefExceptionForResolvedConversationPrReview = function (element) {
    return element.matches(`div.js-resolvable-timeline-thread-container div.comment-holder.js-line-comments
        div.js-resolvable-thread-toggler-container strong`); // same query string as in github.showNames.query
};
github.showNames._hrefExceptionForRecentActivity = function (element) {
    return element.textContent.trim().endsWith(" commented") &&
        element.textContent.trim() !== "You commented" &&
        element.matches(`div.js-recent-activity-container div.Box ul li.Box-row
            div.dashboard-break-word.lh-condensed.text-gray span.text-gray`); // same query string as in github.showNames.query
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
    return !options || options[optionName] !== false; // enabled by default
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

let noticeBoxMessagesToHide = {};
let loadNoticeBoxMessagesToHideFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        execAsync(browser.storage.local.get.bind(browser.storage.local), "githubNoticeBoxMessagesToHide", (res) => {
            noticeBoxMessagesToHide = res.githubNoticeBoxMessagesToHide || {};
            resolve();
        });
    });
};

let saveNoticeBoxMessagesToHideToStorage = function () {
    browser.storage.local.set({githubNoticeBoxMessagesToHide: noticeBoxMessagesToHide});
};

async function main () {
    await Promise.all([
        loadUsernameCacheFromStorage(),
        loadOptionsFromStorage(),
        loadNoticeBoxMessagesToHideFromStorage(),
    ]);

    if (isEnabled(github.signIn.optionName)) {
        github.signIn.signIn();
    } else {
        github.signIn.stopAutoSignIn();
    }
    github.signIn.listenForSignInOtherTab();

    const insertOverlayToHideFlashNoticeEnabled = isEnabled(github.flashNotice.optionName);
    github.flashNotice.hideDismissedNoticeBoxesAndInsertHideOverlayIfEnabled(insertOverlayToHideFlashNoticeEnabled);
    if (!insertOverlayToHideFlashNoticeEnabled) {
        github.flashNotice.removeHideOverlay();
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
browser.runtime.onMessage.addListener((message) => {
    if (message.message === "github-hide-notice-show-all-again") {
        github.flashNotice.showAllAgain();
    }
});
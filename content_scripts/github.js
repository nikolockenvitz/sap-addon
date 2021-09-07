const github = {
    signIn: {
        optionName: "github-sign-in",
        query: "a[href^='/login?']",
        signInOtherTabQuery: ".js-stale-session-flash-signed-in a",
        urlPath: "/login",
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
            a.link-gray-dark.no-underline.flex-self-center strong,
            .merge-status-item.review-item.bg-white.js-details-container.Details strong.text-emphasized,
            small a.text-gray-dark,
            div.js-recent-activity-container div.Box ul li.Box-row div.dashboard-break-word.lh-condensed.text-gray span.text-gray,
            span.js-comment-edit-history details summary div span,
            span.js-comment-edit-history details details-menu.dropdown-menu.js-comment-edit-history-menu
                ul li button.btn-link span.css-truncate-target.v-align-middle.text-bold,
            details.details-overlay details-dialog div div div span.css-truncate-target.v-align-middle.text-bold.text-small,
            div.text-gray span.css-truncate.tooltipped span.css-truncate-target.text-bold,
            form.js-resolvable-timeline-thread-form strong,
            div.js-resolvable-timeline-thread-container div.comment-holder.js-line-comments div.js-resolvable-thread-toggler-container strong
        `,
        queryTooltips: `div.comment-reactions-options button.btn-link.reaction-summary-item.tooltipped[type=submit],
            div.AvatarStack div.AvatarStack-body.tooltipped`,
        regexNameOnProfilePage: `<span class="p-name vcard-fullname d-block overflow-hidden" itemprop="name">([^<]*)</span>`,
        userIdFalsePositives: ["edited"],
    },
    getNamesFromPeople: {
        optionName: "github-get-names-from-people",
        hostname: "people.wdf.sap.corp",
        regexNameOnProfilePage: `<span class='salutation'>[^<]*</span>([^<]*)<`,
    },
};

function signIn() {
    if (url.pathname !== github.signIn.urlPath) return;
    executeFunctionAfterPageLoaded(function () {
        getSignInButtonAndClick();
    });

    domObserver.registerCallbackFunction(github.signIn.optionName, function (mutations, _observer) {
        for (const { target } of mutations) {
            getSignInButtonAndClick(target);
        }
    });
}
let alreadyFoundSignInButton = false;
function getSignInButtonAndClick(element) {
    element = element || document;
    try {
        const signInBtn = element.querySelector(github.signIn.query);
        if (signInBtn && signInBtn.click && !alreadyFoundSignInButton) {
            alreadyFoundSignInButton = true;
            setTimeout(function () {
                signInBtn.click();
            }, 100); // when click is executed directly, github.tools.sap crashes in chrome
            stopAutoSignIn();
        }

        // there's a redirect during login; in case redirects are blocked by the browser: click link
        const redirectLink = getSignInRedirectLink(element);
        if (redirectLink && redirectLink.click) {
            redirectLink.click();
            stopAutoSignIn();
        }
    } catch {}
}
function getSignInRedirectLink(element) {
    const redirectLink = element.querySelector("a#redirect[href^='https://accounts.sap.com/']");
    return redirectLink && url.pathname === "/login" ? redirectLink : null;
}
function stopAutoSignIn() {
    domObserver.unregisterCallbackFunction(github.signIn.optionName);
}
function listenForSignInOtherTab() {
    /* when also non-active tabs are notified that settings changed and user
     * should get signed in, these tabs will be redirected to
     * github.wdf.sap.corp/saml/consume which throws a 404
     * -> only regularly checking works, maybe can be combined with mutation observer
     */
    setInterval(async function () {
        options = await loadFromStorage("options");
        if (isEnabled(github.signIn.optionName)) {
            const signInBtn = document.querySelector(github.signIn.signInOtherTabQuery);
            if (signInBtn) {
                const r = signInBtn.getBoundingClientRect();
                if (r.width !== 0 && r.height !== 0) {
                    signInBtn.click();
                }
            }
        }
    }, 2500);
}

function hideDismissedNoticeBoxesAndInsertHideOverlayIfEnabled(insertOverlayEnabled = false) {
    function getTextOfNoticeBox(noticeBox) {
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
    function hideIfMessageIsSetToHidden(noticeBox) {
        if (getTextOfNoticeBox(noticeBox) in noticeBoxMessagesToHide) {
            noticeBox.style.display = "none";
        }
    }
    function clearOldNoticeBoxMessages() {
        const _90_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
        const now = getUnixTimestamp();
        for (const message in noticeBoxMessagesToHide) {
            const { dismissedAt } = noticeBoxMessagesToHide[message];
            if (now - dismissedAt > _90_DAYS_IN_MS) {
                delete noticeBoxMessagesToHide[message];
            }
        }
    }
    function insertOverlay(noticeBox) {
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
            function listener(event) {
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
            link.addEventListener("keyup", (event) => (event.keyCode === 13 ? listener(event) : null));
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

    domObserver.registerCallbackFunction(github.flashNotice.optionName, function (mutations, _observer) {
        for (const { target } of mutations) {
            if (!target.querySelectorAll) continue;
            for (const match of target.querySelectorAll(github.flashNotice.query)) {
                hideIfMessageIsSetToHidden(match);
                insertOverlay(match);
            }
        }
    });
}
function removeHideOverlayInNoticeBoxes() {
    _hideElementsByQuery(`[data-sap-addon-notice-box-inserted-overlay] .sap-addon-hide-notice-box-overlay`);
}
function showAllNoticeBoxesAgain() {
    for (const message in noticeBoxMessagesToHide) {
        delete noticeBoxMessagesToHide[message];
    }
    saveNoticeBoxMessagesToHideToStorage();

    domObserver.unregisterCallbackFunction(github.flashNotice.optionName);
    executeFunctionAfterPageLoaded(function () {
        _showElementsByQuery(github.flashNotice.query);
    });
}

function _hideElementsByQuery(query, baseElement) {
    _setDisplayAttributeForElementsByQuery(query, baseElement, "none");
}

function _showElementsByQuery(query, baseElement) {
    _setDisplayAttributeForElementsByQuery(query, baseElement, "");
}

function _setDisplayAttributeForElementsByQuery(query, baseElement, displayValue) {
    baseElement = baseElement || document;
    try {
        for (const element of baseElement.querySelectorAll(query)) {
            element.style.display = displayValue;
        }
    } catch {}
}

function replaceGitHubIdsWithUsername() {
    executeFunctionAfterPageLoaded(function () {
        /* execute once in cases where observer is not registered before
         * elements are changed/created (e.g. gets enabled in options)
         */
        _replaceAllChildsWhichAreUserId(document.body);
        saveUsernameCacheToStorage();
    });

    domObserver.registerCallbackFunction(github.showNames.optionName, function (mutations, _observer) {
        for (const { target } of mutations) {
            _replaceAllChildsWhichAreUserId(target);
        }
        saveUsernameCacheToStorage();
    });
}
function showGitHubIdsAgain() {
    domObserver.unregisterCallbackFunction(github.showNames.optionName);
    for (const element of document.querySelectorAll("[data-sap-addon-user-id]")) {
        element.textContent = element.getAttribute("data-sap-addon-user-id");
        element.removeAttribute("data-sap-addon-user-id");
    }
    for (const element of document.querySelectorAll("[data-sap-addon-tooltip-original-content]")) {
        element.setAttribute("aria-label", element.getAttribute("data-sap-addon-tooltip-original-content"));
        element.removeAttribute("data-sap-addon-tooltip-original-content");
    }
}
function _replaceAllChildsWhichAreUserId(element) {
    try {
        for (const queryMatch of element.querySelectorAll(github.showNames.query)) {
            _replaceElementIfUserId(queryMatch);
        }
    } catch {}
    try {
        for (const queryMatch of element.querySelectorAll(github.showNames.queryTooltips)) {
            _replaceElementsTooltip(queryMatch);
        }
    } catch {}
}
async function _replaceElementIfUserId(element) {
    const { userId, prefix, suffix } = _getUserIdIfElementIsUserId(element);
    if (userId) {
        if (element.hasAttribute("data-sap-addon-already-getting-username")) return;
        element.setAttribute("data-sap-addon-already-getting-username", "true");

        const username = await _getUsername(userId);
        if (username) {
            const el = getDirectParentOfText(element, prefix + userId + suffix);
            if (el) {
                el.textContent = prefix + username + suffix;
                el.setAttribute("data-sap-addon-user-id", prefix + userId + suffix);
            }
        }
        element.removeAttribute("data-sap-addon-already-getting-username");
    }
}
function _getUserIdIfElementIsUserId(element) {
    let userId =
        !element.hasAttribute("data-sap-addon-user-id") && !element.querySelector("[data-sap-addon-user-id]")
            ? element.textContent.trim()
            : null;
    if (userId === "" || !isElementALink(element)) {
        if (!_hrefException(element)) {
            userId = null;
        }
    }
    if (userId) {
        for (const possiblePrefixOrSuffix of [
            {
                prefix: "@",
                furtherChecks: element.classList.contains("user-mention"),
            },
            { prefix: "edited by " },
            { suffix: " commented" },
        ]) {
            if (
                ((possiblePrefixOrSuffix.prefix && userId.startsWith(possiblePrefixOrSuffix.prefix)) ||
                    (possiblePrefixOrSuffix.suffix && userId.endsWith(possiblePrefixOrSuffix.suffix))) &&
                (!("furtherChecks" in possiblePrefixOrSuffix) || possiblePrefixOrSuffix.furtherChecks)
            ) {
                return {
                    prefix: possiblePrefixOrSuffix.prefix || "",
                    userId: userId.substring(
                        (possiblePrefixOrSuffix.prefix || "").length,
                        userId.length - (possiblePrefixOrSuffix.suffix || "").length
                    ),
                    suffix: possiblePrefixOrSuffix.suffix || "",
                };
            }
        }
    }
    return { prefix: "", userId, suffix: "" };
}
function _hrefException(element) {
    return (
        _hrefExceptionForReviewer(element) ||
        _hrefExceptionForCommentEditHistoryDialog(element) ||
        _hrefExceptionForResolvedConversation(element) ||
        _hrefExceptionForResolvedConversationPrReview(element) ||
        _hrefExceptionForRecentActivity(element) ||
        _hrefExceptionForYourTeams(element)
    );
}

async function _replaceElementsTooltip(element) {
    if (
        element.hasAttribute("data-sap-addon-tooltip-original-content") ||
        element.hasAttribute("data-sap-addon-already-replacing-tooltip")
    ) {
        return; // already replaced
    }
    element.setAttribute("data-sap-addon-already-replacing-tooltip", "true");
    const originalTooltipText = element.getAttribute("aria-label");
    const replacedTooltipText = await _getNewTooltipText(originalTooltipText);
    element.setAttribute("data-sap-addon-tooltip-original-content", originalTooltipText);
    element.removeAttribute("data-sap-addon-already-replacing-tooltip");
    element.setAttribute("aria-label", replacedTooltipText);
}
async function _getNewTooltipText(originalTooltipText) {
    // currently supports: emoji reactions, project issues cards
    // (A | A and B | A, B, and C) reacted with ... emoji
    // Assigned to (A | A and B | A, B, and C)
    const tooltipTypes = [{ textAfterUserIds: " reacted with " }, { textBeforeUserIds: "Assigned to " }];
    let currentTooltipType;
    for (const tooltipType of tooltipTypes) {
        if (
            (!tooltipType.textBeforeUserIds || originalTooltipText.includes(tooltipType.textBeforeUserIds)) &&
            (!tooltipType.textAfterUserIds || originalTooltipText.includes(tooltipType.textAfterUserIds))
        ) {
            currentTooltipType = tooltipType;
            break;
        }
    }
    if (!currentTooltipType) {
        // maybe only a list of userIds -> continue and see result
        currentTooltipType = {};
    }

    // split tooltip text which has following structure: "<textBefore><textBeforeUserIds><userIds><textAfterUserIds><textAfter>"
    let userIds = originalTooltipText;
    let textBefore = (textAfter = tempSplitResultAtTextBeforeUserIds = "");
    if (currentTooltipType.textBeforeUserIds) {
        [textBefore, tempSplitResultAtTextBeforeUserIds] = originalTooltipText.split(currentTooltipType.textBeforeUserIds);
        userIds = tempSplitResultAtTextBeforeUserIds;
    }
    if (currentTooltipType.textAfterUserIds) {
        [userIds, textAfter] = (tempSplitResultAtTextBeforeUserIds || originalTooltipText).split(currentTooltipType.textAfterUserIds);
    }

    const usernamePromises = [];
    if (userIds.includes(", and ")) {
        // more than two names
        const [firstUserIds, lastUserId] = userIds.split(", and ");
        for (const userId of firstUserIds.split(", ")) {
            usernamePromises.push(_getUsername(userId));
        }
        // lastUserId should not match something like "5 more" (e.g. in A, ..., B, and 5 more)
        if (!new RegExp(`\\d+ more`).exec(lastUserId)) {
            usernamePromises.push(_getUsername(lastUserId));
        }
    } else if (userIds.includes(" and ")) {
        // two names
        for (const userId of userIds.split(" and ")) {
            usernamePromises.push(_getUsername(userId));
        }
    } else {
        // one name
        usernamePromises.push(_getUsername(userIds));
    }
    const usernames = (await Promise.allSettled(usernamePromises)).map((promiseResult) => promiseResult.value);
    if (usernames.includes(null)) {
        // probably not a tooltip with usernames -> return original text
        return originalTooltipText;
    }
    return (
        textBefore +
        (currentTooltipType.textBeforeUserIds || "") +
        _makeUsernameTextForTooltip(usernames) +
        (currentTooltipType.textAfterUserIds || "") +
        textAfter
    );
}
function _makeUsernameTextForTooltip(usernames) {
    let usernameText = "";
    for (let i = 0; i < usernames.length; i++) {
        if (i !== 0 && usernames.length !== 2) {
            usernameText += ", ";
        }
        if (i === usernames.length - 1) {
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
}

/* The request queue will store an array for each userId that should be retrieved from People/GitHub.
This array is to avoid multiple requests when a userId is requested multiple times (so that only
one request is made in the end). All waiting "observers" will be notified once the first call
received a username. When a username has been retrieved and is stored in the cache this queue is no
longer needed; it's only for the first time when _getUsername is called simultaniously multiple times
and there's no username in the cache yet.
*/
const userIdRequestQueue = {};

async function _getUsername(userId) {
    if (!userId || github.showNames.userIdFalsePositives.includes(userId)) return null;
    const user = usernameCache[userId];
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
        const username = await _fetchUsername(userId);
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
        for (const notify of observers) {
            notify(username);
        }
        return username;
    }
}

function _fetchUsername(userId) {
    return new Promise(function (resolve) {
        execAsync(
            browser.runtime.sendMessage.bind(browser.runtime),
            {
                contentScriptQuery: "githubFetchUsername",
                args: [
                    userId,
                    isEnabled(github.getNamesFromPeople.optionName),
                    github.getNamesFromPeople.hostname,
                    github.getNamesFromPeople.regexNameOnProfilePage,
                    url.hostname,
                    github.showNames.regexNameOnProfilePage,
                ],
            },
            (username) => {
                resolve(username);
            }
        );
    });
}

function _hrefExceptionForReviewer(element) {
    // reviewer (approval / pending) don't have a link to the user -> therefore exception needs to be added
    if (
        element.classList.contains("text-emphasized") &&
        element.parentElement &&
        element.parentElement.parentElement &&
        element.parentElement.parentElement.querySelector("[data-hovercard-type=user]")
    ) {
        return true;
    }
}
function _hrefExceptionForCommentEditHistoryDialog(element) {
    // dialog which displays comment edit history doesn't has a link to the user
    return element.matches(`details.details-overlay details-dialog div div div
        span.css-truncate-target.v-align-middle.text-bold.text-small`); // same query string as in github.showNames.query
}
function _hrefExceptionForResolvedConversation(element) {
    return (
        element.parentElement &&
        element.parentElement.tagName === "FORM" &&
        element.parentElement.classList.contains("js-resolvable-timeline-thread-form")
    );
}
function _hrefExceptionForResolvedConversationPrReview(element) {
    return element.matches(`div.js-resolvable-timeline-thread-container div.comment-holder.js-line-comments
        div.js-resolvable-thread-toggler-container strong`); // same query string as in github.showNames.query
}
function _hrefExceptionForRecentActivity(element) {
    return (
        element.textContent.trim().endsWith(" commented") &&
        element.textContent.trim() !== "You commented" &&
        element.matches(`div.js-recent-activity-container div.Box ul li.Box-row
            div.dashboard-break-word.lh-condensed.text-gray span.text-gray`)
    ); // same query string as in github.showNames.query
}
function _hrefExceptionForYourTeams(element) {
    // same query string as in github.showNames.query
    return element.matches(`div.text-gray span.css-truncate.tooltipped span.css-truncate-target.text-bold`);
}

function getUnixTimestamp() {
    return Math.floor(new Date().getTime());
}

function isElementALink(element) {
    // check childs
    for (const linkChild of element.querySelectorAll("[href]")) {
        if (linkChild && element.textContent.trim() === linkChild.textContent.trim()) {
            return true;
        }
    }
    // check parents
    while (true) {
        if (!element) return false;
        if (element.hasAttribute("href")) return true;
        if (
            element.classList.contains("btn-link") &&
            (element.tagName.toLowerCase() === "button" ||
                (element.tagName.toLowerCase() === "summary" && element.getAttribute("role") === "button"))
        ) {
            return true;
        }
        element = element.parentElement;
    }
}

function getDirectParentOfText(baseElement, text) {
    if (baseElement.childNodes.length === 1 && baseElement.firstChild.nodeName === "#text" && baseElement.textContent.trim() === text) {
        return baseElement;
    } else {
        for (const child of baseElement.childNodes) {
            if (child.childNodes.length > 0) {
                const r = getDirectParentOfText(child, text);
                if (r) {
                    return r;
                }
            }
        }
    }
}

let options;
let usernameCache;
function saveUsernameCacheToStorage() {
    return saveToStorage("usernameCache", usernameCache);
}
let noticeBoxMessagesToHide = {};
function saveNoticeBoxMessagesToHideToStorage() {
    return saveToStorage("githubNoticeBoxMessagesToHide", noticeBoxMessagesToHide);
}

async function main() {
    [usernameCache, options, noticeBoxMessagesToHide] = await Promise.all([
        loadFromStorage("usernameCache"),
        loadFromStorage("options"),
        loadFromStorage("githubNoticeBoxMessagesToHide"),
    ]);

    if (isEnabled(github.signIn.optionName)) {
        signIn();
    } else {
        stopAutoSignIn();
    }
    listenForSignInOtherTab();

    const insertOverlayToHideFlashNoticeEnabled = isEnabled(github.flashNotice.optionName);
    hideDismissedNoticeBoxesAndInsertHideOverlayIfEnabled(insertOverlayToHideFlashNoticeEnabled);
    if (!insertOverlayToHideFlashNoticeEnabled) {
        removeHideOverlayInNoticeBoxes();
    }

    if (isEnabled(github.showNames.optionName)) {
        replaceGitHubIdsWithUsername();
    } else {
        showGitHubIdsAgain();
    }
}
main();
browser.runtime.onConnect.addListener(() => {
    main();
});
browser.runtime.onMessage.addListener((message) => {
    if (message.message === "github-hide-notice-show-all-again") {
        showAllNoticeBoxesAgain();
    }
});

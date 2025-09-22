github.showNames = {
    optionName: "github-show-names",
    // query, href exceptions, and queryTooltips will be filled with values below
    query: ``,
    hrefExceptions: [],
    userMentions: [],
    queryTooltips: ``,
    queryTooltipsAriaDescribedbyRef: ``,
    regexNameOnProfilePage: `<span class="p-name vcard-fullname d-block overflow-hidden" itemprop="name">([^<]*)</span>`,
    userIdFalsePositives: ["edited", "github-actions"],
    documentTitle: {
        optionName: "github-replace-names-in-document-title",
        userIdRegex: "[dDiI]\\d{6}|[cC]\\d{7}",
        rules: [
            { prefix: ` by `, suffix: ` · Pull Request` },
            { prefix: ` · `, suffix: `/` },
            { prefix: "^", prefixReplace: "", suffix: "/" },
            { prefix: "^", prefixReplace: "", suffix: "'s access for" },
        ],
    },
};

function initializeGitHubIdQueries() {
    // commit author, direct mentions
    _addQuery(`.user-mention`, { userMention: true });
    _addQuery(`.commit-author.user-mention`, { hrefException: true });
    _addQuery(`.author[data-test-selector="pr-timeline-events-commit-actor-name"]`, { hrefException: true });
    // commit author (last commit / commit history; older GHE)
    _addQuery(`div[data-testid="author-avatar"] > a[data-testid="avatar-icon-link"] + a[data-hovercard-url^="/users/"]`);
    _addQuery(`div[data-testid="author-link"] > a[data-hovercard-url^="/users/"]`);
    // commit author of last commit not linked to a GH account (single file view, box with info above actual file content)
    _addQuery(`div.Box span.text-bold.Link--primary`, { hrefException: true });
    // several places where username can be found (hovering opens card with profile info)
    _addQuery(`[data-hovercard-type=user]`);
    // ???
    _addQuery(`a.text-emphasized.Link--primary`);
    // repo landing page: contributor list
    _addQuery(`div.Layout-sidebar div > h2 + ul > li > a + span > a.Link--primary > strong`);
    // (pending) reviewers in PR ("xyz was requested for review" / "xyz approved these changes")
    _addQuery(
        `details.js-merge-review-section div.merge-status-item.review-item.js-details-container.Details div.review-status-item strong.text-emphasized`,
        {
            hrefException: (element) => {
                return element?.parentElement?.parentElement?.querySelector("[data-hovercard-type=user]");
            },
        }
    );
    // PR: "xyz requested your review" box
    _addQuery(`div#repo-content-pjax-container div.flash.flash-warn div a.text-emphasized.Link--primary`);
    // PR: "Files changed" > "Conversations"
    _addQuery(`a.js-conversations-menu-item div.d-flex img.avatar + span`);
    // PR hovercard in PR list or when PR is referenced somewhere ("xyz approved, you commented", where xyz might be a list of users)
    _addQuery(
        `div.Popover[data-hovercard-target-url*="/pull/"] > div.Popover-message--large.Box div.p-3 > div.border-top div.hovercard-icon + span.lh-condensed`,
        {
            hrefException: (element) => {
                return (
                    element.textContent.trim().endsWith(" approved, you commented") ||
                    element.textContent.trim().endsWith(" requested changes, you commented")
                );
            },
        }
    );
    // hovercard
    _addQuery(`div.Popover-message section + section a.text-bold.Link--primary`);
    // deployments: "branch is waiting to be deployed" "by", "Deployment protection rules" "requested review", "Review pending deployments" "requested by"
    _addQuery(`div.branch-action div.merge-status-list a.text-bold`);
    _addQuery(`div.actions-fullwidth-module > table td > div > div:has(img.avatar) + div > a.text-bold.Link--primary`);
    _addQuery(`dialog div.Overlay-header h3 div span.text-semibold:first-child`, { hrefException: true });
    // projects (classic): card/issue creator
    _addQuery(`div.project-column div.d-flex small.color-fg-muted a.color-fg-default`);
    _addQuery(`div.d-flex div.js-project-issue-details-container small.color-fg-muted a.color-fg-default`);
    // projects (classic): activity pane
    _addQuery(`div.js-project-activity-pane.Details ul.js-project-activity-container li p a.text-bold`, { userMention: true });
    // projects (v2): item/issue details: creator of this item
    _addQuery(`projects-v2 header div > figure ~ address > span:first-child`, { hrefException: true });
    // projects (v2): item details: most-recent description editor
    _addQuery(`projects-v2 section article > header address[data-testid="author-login"]`, { hrefException: true });
    // projects (v2): issue details: comment author (creator)
    _addQuery(`projects-v2 a[data-testid="issue-body-header-author"]`);
    // projects (v2): issue details: comment author (comments)
    _addQuery(`projects-v2 div[data-testid="comment-header-left-side-items"] a[data-testid="avatar-link"]`);
    // projects (v2): issue details: comment edited by + menu with edits
    _addQuery(`projects-v2 div[data-testid="issue-body"] div:has(h3) + div > div > span > a`);
    _addQuery(
        `projects-v2 div[class^="Overlay__"] ul[role="menu"] > li[role="none"] > ul[role="group"] > li[role="menuitem"] > span:has(img[data-testid="github-avatar"]) + div[data-component="ActionList.Item--DividerContainer"] > div span[id$="--label"] > span`,
        { hrefException: true }
    );
    // projects (v2): item/issue details: assignees
    _addQuery(`projects-v2 section div[data-testid="sidebar-field-Assignees"] img + span`, {
        hrefException: true,
    });
    _addQuery(
        `projects-v2 div[data-testid="sidebar-section"] ul > li > a[data-hovercard-url] > span:has(img[data-testid="github-avatar"]) + div[data-component="ActionList.Item--DividerContainer"] > span > div[data-testid="issue-assignees"]`
    );
    // projects (v2): item/issue details: assignees ("A and B", ..., "A, B, C, and D", ...)
    _addQuery(`projects-v2 section div[data-testid="sidebar-field-Assignees"] div > span[class*="AvatarStack"] + span`, {
        hrefException: true,
    });
    // projects (v2): issue details: timeline events (user mentions, added labels/assignees, etc.)
    _addQuery(
        `projects-v2 div[data-testid="issue-timeline-front"] > section[aria-label="Events"] div.Timeline-Item a[data-testid="actor-link"][data-hovercard-url^="/users/"]`
    );
    // projects (v2): issue details: timeline events: person that has been assigned
    _addQuery(
        `projects-v2 div[data-testid="issue-timeline-front"] > section[aria-label="Events"] div.Timeline-Item a[data-hovercard-url^="/users/"][class*="assignees-module__assigneeLink--"]`
    );
    // projects (v2): table assignees column
    _addQuery(`projects-v2 div[data-testid^="TableCell"][data-testid$="column: Assignees}"] img + span`, {
        hrefException: true,
    });
    _addQuery(
        `projects-v2 div[data-testid^="TableCell"][data-testid$="column: Assignees}"] span[class*="AvatarStack__AvatarStackWrapper"] + span`,
        {
            hrefException: true,
        }
    );
    // projects (v2): table reviewers column
    _addQuery(`projects-v2 div[data-testid^="TableCell"][data-testid$="column: Reviewers}"] img + span`, {
        hrefException: true,
    });
    _addQuery(
        `projects-v2 div[data-testid^="TableCell"][data-testid$="column: Reviewers}"] span[class*="AvatarStack__AvatarStackWrapper"] + span`,
        {
            hrefException: true,
        }
    );
    // projects (v2): slice by assignees
    _addQuery(
        `projects-v2 div[data-testid="slicer-panel"] li div.actionlistitem-leadingcontent:has(div > img[data-testid="github-avatar"]) + div > div > h3`,
        {
            hrefException: true,
        }
    );
    // projects (v2): group by assignees
    _addQuery(
        `projects-v2 div[data-testid*="group-header"] span[class*="AvatarStack__AvatarStackWrapper"] + span[data-testid="group-name"]`,
        {
            hrefException: true,
        }
    );
    // projects (v2): card assignee tooltip
    _addTooltipQuery(`projects-v2 div[data-testid="board-card-header"] figure img[aria-describedby]`, { ariaDescribedbyRef: true });
    // projects (v2): roadmap assignee tooltip
    _addTooltipQuery(
        `projects-v2 div[data-testid="roadmap-view-item-pill-content"] figure[data-testid="roadmap-item-assignees"] img[aria-describedby]`,
        { ariaDescribedbyRef: true }
    );
    // projects (v2): roadmap group name
    _addQuery(
        `projects-v2 div[data-testid="roadmap-items"] span[class*="AvatarStack__AvatarStackWrapper"] + span[data-testid="group-name"]`,
        { hrefException: true }
    );
    // projects (v2): archived items list item
    _addQuery(`projects-v2 main ul[data-testid="archived-item-list"] li div relative-time + span`, { hrefException: true });
    // wiki revisions history
    _addQuery(`#wiki-wrapper #version-form div > a.Link--muted span.text-bold`);
    // recent activity in dashboard (user commented)
    _addQuery(
        `div.js-recent-activity-container div.Box ul li.Box-row div.dashboard-break-word.lh-condensed.color-text-secondary span.color-text-secondary`,
        {
            hrefException: (element) => {
                return element.textContent.trim().endsWith(" commented") && element.textContent.trim() !== "You commented";
            },
        }
    );
    // comment edit history
    _addQuery(`span.js-comment-edit-history details summary div span`);
    _addQuery(`div.js-suggested-changes-contents span details.dropdown summary.btn-link div span`);
    _addQuery(
        `details details-menu.dropdown-menu.js-comment-edit-history-menu ul li button.btn-link span.css-truncate-target.v-align-middle.text-bold`
    );
    // dialog with comment edit history
    _addQuery(`details.details-overlay details-dialog div div div span.css-truncate-target.v-align-middle.text-bold.text-small`, {
        hrefException: true,
    });
    // dashboard: PR comments (white box: xyz commented ... ago)
    _addQuery(`div.issues_comment div.message a.Link--secondary > span.Link--primary.text-bold`);
    // team members in hovercard of a team in dashboard > your teams
    _addQuery(`div.Popover-message div.d-flex > div.color-fg-muted > span.css-truncate.tooltipped span.css-truncate-target.text-bold`, {
        hrefException: true,
    });
    // comment resolver in PR reviews (Conversation)
    _addQuery(`form.js-resolvable-timeline-thread-form strong`, { hrefException: true });
    // comment resolver in PR (Files Changed)
    _addQuery(
        `div.js-resolvable-timeline-thread-container div.comment-holder.js-line-comments div.js-resolvable-thread-toggler-container strong`,
        { hrefException: true }
    );
    _addQuery(`div.comment-holder details.review-thread-component.js-comment-container summary.js-toggle-outdated-comments strong`, {
        hrefException: true,
    });
    // member statuses on team's overview page (directly next to icon)
    _addQuery(`div.user-status-container a.Link--primary.text-bold.no-underline[data-hovercard-type="user"]`);
    // list of users who contributed to a file (directly next to icon)
    _addQuery(`details#blob_contributors_box details-dialog ul li a.Link--primary.no-underline`);
    // commit list (Files Changed view of PR)
    _addQuery(`#files_bucket div.pr-toolbar div.diffbar a.select-menu-item div.select-menu-item-text span.description`);
    // chart tooltip (insights > pulse)
    _addQuery(`body > div.svg-tip.n strong ~ strong`);
    // user details in organization's admin view (people > specific user)
    _addQuery(`div.table-list-header > span.table-list-heading > strong`, { hrefException: true }); // xyz has access to n repos
    _addQuery(`p.org-user-notice-content > strong:first-child`, { hrefException: true }); // as an owner, xyz has ...
    // search: issues (xyz opened on ...) and commits (xyz committed ...)
    _addQuery(`div.issue-list-item div.text-small a.text-bold:not([data-hovercard-type="repository"])`);
    // release contributors
    _addQuery(`section div.col-md-9 > div.Box > div.Box-footer > div > h3 + ul + div.color-fg-muted`, { hrefException: true });
    // github app developer on app page
    _addQuery(`div.Layout-sidebar li > img.avatar.avatar-user + a`);

    // tooltips (reactions)
    _addTooltipQuery(`tool-tip[for^=reactions--reaction_button_component-]`);
    _addTooltipQuery(`button[aria-label="All reactions"] ~ span[role="tooltip"]`);
    // tooltips (PR reviewers)
    _addTooltipQuery(`tool-tip[for^=awaiting-review-]`);
    _addTooltipQuery(`tool-tip[for^=review-status-]`);
    _addTooltipQuery(`tool-tip[for^=codeowner-]`);
    // tooltips: dashboard -> your teams -> popup (team member profile pictures)
    _addTooltipQuery(`div.AvatarStack div.AvatarStack-body.tooltipped`);
    // tooltips of 3+ committers
    _addTooltipQuery(`div.AvatarStack--three-plus + div > span.text-bold:first-child`);
}
function _addQuery(query, options = {}) {
    github.showNames.query += (github.showNames.query === "" ? "" : ",\n") + query;

    if (options?.hrefException) {
        switch (typeof options.hrefException) {
            case "boolean":
                github.showNames.hrefExceptions.push((element) => {
                    return element.matches(query);
                });
                break;

            case "function":
                github.showNames.hrefExceptions.push((element) => {
                    if (!element.matches(query)) return false;
                    return options?.hrefException(element);
                });
                break;

            default:
                console.error("Unexpected hrefException", options.hrefException);
                break;
        }
    }

    if (options?.userMention) {
        github.showNames.userMentions.push(query);
    }
}
function _addTooltipQuery(query, options = {}) {
    if (options.ariaDescribedbyRef) {
        github.showNames.queryTooltipsAriaDescribedbyRef += (github.showNames.queryTooltipsAriaDescribedbyRef === "" ? "" : ",\n") + query;
    } else {
        github.showNames.queryTooltips += (github.showNames.queryTooltips === "" ? "" : ",\n") + query;
    }
}
function initializeFurtherHrefExceptions() {
    github.showNames.hrefExceptions.push(_isInsightsPulseTooltip);
}
initializeGitHubIdQueries();
initializeFurtherHrefExceptions();

function replaceGitHubIdsWithUsername() {
    executeFunctionAfterPageLoaded(function () {
        /* execute once in cases where observer is not registered before
         * elements are changed/created (e.g. gets enabled in options)
         */
        _replaceAllChildsWhichAreUserId(document.body);
    });

    domObserver.registerCallbackFunction(github.showNames.optionName, function (mutations, _observer) {
        for (const { target } of mutations) {
            _replaceAllChildsWhichAreUserId(target);
        }
    });
}
function showGitHubIdsAgain() {
    domObserver.unregisterCallbackFunction(github.showNames.optionName);
    for (const element of document.querySelectorAll("[data-sap-addon-original-content]")) {
        element.textContent = element.getAttribute("data-sap-addon-original-content");
        element.removeAttribute("data-sap-addon-original-content");
    }
    for (const element of document.querySelectorAll("[data-sap-addon-tooltip-original-content]")) {
        const tooltipType = element.getAttribute("data-sap-addon-tooltip-type");
        const originalTooltipContent = element.getAttribute("data-sap-addon-tooltip-original-content");
        if (tooltipType === "element") {
            element.textContent = originalTooltipContent;
        } else if (tooltipType === "aria-label") {
            element.setAttribute("aria-label", originalTooltipContent);
            element.setAttribute("data-visible-text", originalTooltipContent);
        } else if (tooltipType === "title") {
            element.setAttribute("title", originalTooltipContent);
        }
        element.removeAttribute("data-sap-addon-tooltip-original-content");
        element.removeAttribute("data-sap-addon-tooltip-new-content");
        element.removeAttribute("data-sap-addon-tooltip-type");
    }
}
function _replaceAllChildsWhichAreUserId(element) {
    try {
        for (const queryMatch of element.querySelectorAll(github.showNames.query)) {
            _replaceElementIfUserId(queryMatch);
        }
    } catch { }
    try {
        for (const queryMatch of element.querySelectorAll(github.showNames.queryTooltips)) {
            _replaceElementsTooltip(queryMatch);
        }
    } catch { }
    try {
        for (const queryMatch of element.querySelectorAll(github.showNames.queryTooltipsAriaDescribedbyRef)) {
            const tooltipElement = document.getElementById(queryMatch.getAttribute("aria-describedby"));
            if (tooltipElement === null) continue;
            _replaceElementsTooltip(tooltipElement);
        }
    } catch { }

    /**
     * When an element is changed where we previously replaced the user id (e.g. tooltip with reactions),
     * our query for matching this element might start too far up in the DOM tree, while the element
     * that has been changed (and was noticed by the DOM observer) is deep inside our query
     * (e.g. our query is "div#1 div#2 span" where the span holds the user id; if div#2 would change
     * and be checked in this function, the query wouldn't work (since we query from the match,
     * i.e. div#2, and not document.body here))
     * Similary, for tooltips, we might have the element with the tooltip and only a child is noticed
     * by the DOM observer.
     *
     * So far we noticed this only for the latter case (reaction tooltip in project issue).
     * Below's implementation is concretely for this and might need to be generalized later
     * if we also see this in other cases.
     */
    const parentWithUserIdTooltip = getParentWithAlreadyReplacedUserIdTooltip(element);
    if (parentWithUserIdTooltip) {
        _replaceElementsTooltip(parentWithUserIdTooltip);
    }
}
function getParentWithAlreadyReplacedUserIdTooltip(element) {
    let temp = element;
    if (temp.nodeName === "#text") return null;
    while (true) {
        if (!temp) return null;
        if (temp.hasAttribute("data-sap-addon-tooltip-original-content")) {
            return temp;
        }
        temp = temp.parentElement;
    }
}
async function _replaceElementIfUserId(element) {
    const { userId, prefix, suffix } = _getUserIdIfElementIsUserId(element);
    if (userId) {
        if (element.hasAttribute("data-sap-addon-already-getting-username")) return;
        element.setAttribute("data-sap-addon-already-getting-username", "true");
        let previousWidthInsightPulseTooltip = null;
        if (_isInsightsPulseTooltip(element)) {
            previousWidthInsightPulseTooltip = element.parentElement.getBoundingClientRect().width;
        }

        let username;
        if (isUserIdList({ userId, prefix, suffix })) {
            const usernames = await getUsernamesFromMultipleUserIdsString(userId);
            username = _makeUsernameTextForTooltip(usernames);
        } else {
            username = await _getUsername(userId);
        }
        if (username) {
            // replace userId with username
            const idToNameElement = getDirectParentOfText(element, prefix + userId + suffix);
            if (idToNameElement) {
                idToNameElement.textContent = prefix + username + suffix;
                idToNameElement.setAttribute("data-sap-addon-original-content", prefix + userId + suffix);

                if (previousWidthInsightPulseTooltip) {
                    const currentWidth = element.parentElement.getBoundingClientRect().width;
                    const offsetLeft = parseFloat(element.parentElement.style.left);
                    element.parentElement.style.left = `${offsetLeft + (previousWidthInsightPulseTooltip - currentWidth) / 2}px`;
                }
            }
            // replace username with userId
            const nameToIdElement = getNextElementSiblingDeep(idToNameElement);
            if (nameToIdElement && nameToIdElement.textContent.includes(username)) {
                if (!nameToIdElement.hasAttribute("data-sap-addon-original-content")) {
                    nameToIdElement.setAttribute("data-sap-addon-original-content", nameToIdElement.textContent);
                    nameToIdElement.textContent = nameToIdElement.textContent.replace(username, userId);
                }
            }
        }
        element.removeAttribute("data-sap-addon-already-getting-username");
    }
}
function _getUserIdIfElementIsUserId(element) {
    let userId =
        !element.hasAttribute("data-sap-addon-original-content") && !element.querySelector("[data-sap-addon-original-content]")
            ? element.textContent.trim()
            : null;
    if (userId === "" || !isElementALink(element)) {
        if (!_hrefException(element)) {
            userId = null;
        }
    }
    if (userId) {
        userId = _exceptionForCommitListPRFilesChanged(element, userId);
    }
    if (userId) {
        for (const possiblePrefixOrSuffix of [
            {
                prefix: "@",
                furtherChecks: () => {
                    return github.showNames.userMentions.findIndex((q) => element.matches(q)) !== -1;
                },
            },
            { prefix: "edited by " },
            { suffix: " approved, you commented" },
            { suffix: " requested changes, you commented" },
            { suffix: " commented" },
        ]) {
            if (
                ((possiblePrefixOrSuffix.prefix && userId.startsWith(possiblePrefixOrSuffix.prefix)) ||
                    (possiblePrefixOrSuffix.suffix && userId.endsWith(possiblePrefixOrSuffix.suffix))) &&
                (!("furtherChecks" in possiblePrefixOrSuffix) || possiblePrefixOrSuffix.furtherChecks())
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
    for (const hrefException of github.showNames.hrefExceptions) {
        if (hrefException(element)) {
            return true;
        }
    }
    return false;
}
function _exceptionForCommitListPRFilesChanged(element, userId) {
    if (element.matches(`a.select-menu-item div.select-menu-item-text span.description`)) {
        if (
            element.childNodes.length === 3 &&
            element.childNodes[1].nodeName === "RELATIVE-TIME" &&
            element.childNodes[2].nodeName === "#text"
        ) {
            if (element.childNodes[0].nodeName !== "#text") {
                // already replaced
                return null;
            }
            if (element.childNodes[0].textContent.endsWith(" commits")) return null;
            return replaceTextNodeWithDomElementForUsername(element, 0).textContent;
        } else if (element.childNodes.length === 1) {
            return null;
        }
    }
    return userId;
}
function isUserIdList({ userId }) {
    return userId.includes(" and ");
}

async function _replaceElementsTooltip(element) {
    if (element.hasAttribute("data-sap-addon-already-replacing-tooltip")) {
        return; // already being replaced
    }

    // old tooltips use aria-label or even title, new ones use custom html element tool-tip with textContent
    const tooltipType =
        element.nodeName === "TOOL-TIP"
            ? "element"
            : element.hasAttribute("aria-label")
                ? "aria-label"
                : element.hasAttribute("title")
                    ? "title"
                    : "";
    const originalTooltipText =
        tooltipType === "element"
            ? element.textContent.trim()
            : tooltipType === "aria-label"
                ? element.getAttribute("aria-label")
                : tooltipType === "title"
                    ? element.getAttribute("title")
                    : "";
    if (originalTooltipText === element.getAttribute("data-sap-addon-tooltip-new-content")) {
        // value is still what we last set
        return;
        // otherwise, tooltip has been updated and we need to replace again
    }
    element.setAttribute("data-sap-addon-already-replacing-tooltip", "true");
    const replacedTooltipText = await _getNewTooltipText(originalTooltipText);
    element.setAttribute("data-sap-addon-tooltip-original-content", originalTooltipText);
    element.setAttribute("data-sap-addon-tooltip-new-content", replacedTooltipText);
    element.setAttribute("data-sap-addon-tooltip-type", tooltipType);
    if (tooltipType === "element") {
        element.textContent = replacedTooltipText;
    } else if (tooltipType === "aria-label") {
        element.setAttribute("aria-label", replacedTooltipText);
        element.setAttribute("data-visible-text", replacedTooltipText);
    } else if (tooltipType === "title") {
        element.setAttribute("title", replacedTooltipText);
    }
    element.removeAttribute("data-sap-addon-already-replacing-tooltip");
}
async function _getNewTooltipText(originalTooltipText) {
    // currently supports: emoji reactions, project issues cards
    // (A | A and B | A, B, and C) reacted with ... emoji
    // Assigned to (A | A and B | A, B, and C)
    const tooltipTypes = [
        { textAfterUserIds: " reacted with " },
        { textBeforeUserIds: "Assigned to " },
        { textBeforeUserIds: "Awaiting requested review from " },
        { textAfterUserIds: " is a code owner" },
        { textAfterUserIds: " approved these changes" },
        { textAfterUserIds: " requested changes" },
        { textAfterUserIds: " left review comments" },
    ];
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

    const usernames = await getUsernamesFromMultipleUserIdsString(userIds);
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
async function getUsernamesFromMultipleUserIdsString(userIds) {
    const usernamePromises = [];
    if (userIds.includes(", and ")) {
        // more than two names
        const [firstUserIds, lastUserId] = userIds.split(", and ");
        for (const userId of firstUserIds.split(", ")) {
            usernamePromises.push(_getUsername(userId));
        }
        // lastUserId should not match something like "5 more" (e.g. in A, ..., B, and 5 more) or "2 other contributors" (e.g. in release contributors: A, B, and 2 other contributors)
        if (new RegExp(`^\\d+ (more|other contributors)$`).exec(lastUserId) === null) {
            usernamePromises.push(_getUsername(lastUserId));
        } else {
            usernamePromises.push(Promise.resolve(lastUserId));
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
    return usernames;
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
const userIdUpdateQueue = {};

const USERNAME_CACHE_IX_NAME = 0;
const USERNAME_CACHE_IX_UPDATED_AT = 1;

const USERNAME_CACHE_MAX_TIME_IN_S = 2_592_000; // 30 days: 30 * 24 * 60 * 60 = 2_592_000

async function _getUsername(userId) {
    if (!userId || github.showNames.userIdFalsePositives.includes(userId)) return null;
    const user = usernameCache[userId];
    const now = getUnixTimestamp(); // seconds/milliseconds don't matter so it's sufficient to get it only once
    if (user && user[USERNAME_CACHE_IX_NAME]) {
        // check if value is older than threshold
        if (now - user[USERNAME_CACHE_IX_UPDATED_AT] > USERNAME_CACHE_MAX_TIME_IN_S && !(userId in userIdUpdateQueue)) {
            // refetch in background; prevent multiple refetches
            // still return old value directly for best performance -> will only be updated when cache is requested the next time
            userIdUpdateQueue[userId] = true;
            (async () => {
                const username = await _fetchUsername(userId);
                if (username) {
                    usernameCache[userId] = [username, now];
                    saveUsernameCacheToStorage();
                }
                delete userIdUpdateQueue[userId];
            })();
        }
        return user[USERNAME_CACHE_IX_NAME] || userId;
    } else if (userId in userIdRequestQueue) {
        return new Promise((resolve) => {
            userIdRequestQueue[userId].push(function (username) {
                resolve(username || userId);
            });
        });
    } else {
        userIdRequestQueue[userId] = [];
        const username = await _fetchUsername(userId);
        if (username) {
            usernameCache[userId] = [username, now];
            saveUsernameCacheToStorage();
        }
        const observers = userIdRequestQueue[userId];
        delete userIdRequestQueue[userId];
        for (const notify of observers) {
            notify(username);
        }
        return username || userId;
    }
}

function _fetchUsername(userId) {
    return new Promise(function (resolve) {
        execAsync(
            browser.runtime.sendMessage.bind(browser.runtime),
            {
                contentScriptQuery: "githubFetchUsername",
                args: [userId, url.host, github.showNames.regexNameOnProfilePage],
            },
            (username) => {
                if (username && username !== "undefined") {
                    const name = decodeHtml(username);
                    resolve(name);
                } else {
                    resolve(null);
                }
            }
        );
    });
}

function decodeHtml(html) {
    // https://stackoverflow.com/a/7394787
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value.trim();
}

const regexPulseTooltipTextContentBefore = new RegExp(`^ commit(|s) authored by $`);
function _isInsightsPulseTooltip(element) {
    // same query string as in github.showNames.query + additionally check for text before
    return (
        element.matches(`body > div.svg-tip.n strong ~ strong`) &&
        regexPulseTooltipTextContentBefore.test(element.parentElement.childNodes[1].textContent)
    );
}

function getUnixTimestamp() {
    return Math.floor(Date.now() / 1000);
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
    } else if (
        // sometimes text is directly after the user icon w/o separate html tag
        // however, a real element is needed (not only a text node; a data-attribute will be set on the element later)
        baseElement.childNodes.length === 2 &&
        baseElement.childNodes[0].nodeName === "IMG" &&
        baseElement.childNodes[1].nodeName === "#text" &&
        baseElement.childNodes[1].textContent.trim() === text
    ) {
        return replaceTextNodeWithDomElementForUsername(baseElement, 1);
    } else if (
        baseElement.childNodes.length === 3 &&
        baseElement.childNodes[0].nodeName === "#text" &&
        baseElement.childNodes[1].nodeName === "IMG" &&
        baseElement.childNodes[2].nodeName === "#text" &&
        baseElement.childNodes[2].textContent.trim() === text
    ) {
        return replaceTextNodeWithDomElementForUsername(baseElement, 2);
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
function replaceTextNodeWithDomElementForUsername(baseElement, indexUserId) {
    const textNode = baseElement.childNodes[indexUserId];
    const newElement = document.createElement("span");
    newElement.textContent = textNode.textContent.trim();
    baseElement.replaceChild(newElement, textNode);
    newElement.insertAdjacentHTML("afterend", " ");
    return newElement;
}
function getNextElementSiblingDeep(element) {
    let temp = element.nextElementSibling;
    while (true) {
        const firstChild = temp?.children[0];
        if (!firstChild) return temp;
        temp = firstChild;
    }
}

let documentTitleUserIdState = {
    intervalId: null,
    oldTitle: null,
    newTitle: null,
};
function replaceGitHubIdsWithUsernameInDocumentTitle() {
    executeFunctionAfterPageLoaded(function () {
        _checkDocumentTitleAndReplaceUserId();
    });
    if (documentTitleUserIdState.intervalId === null) {
        documentTitleUserIdState.intervalId = setInterval(() => {
            _checkDocumentTitleAndReplaceUserId();
        }, 1_000);
    }
}
async function _checkDocumentTitleAndReplaceUserId() {
    const title = document.title;
    if (title === documentTitleUserIdState.newTitle) {
        // document.title matches with what we set the last time (event on our change)
        return;
    }
    // GitHub changed the title -> save it so that we can restore it when feature is disabled
    documentTitleUserIdState.oldTitle = title;
    // check that feature is enabled + loop through all possible replacement rules
    if (!isEnabled(github.showNames.optionName)) return;
    if (github.showNames.documentTitle.rules.length > 1 && !new RegExp(github.showNames.documentTitle.userIdRegex).exec(title)) {
        // if there is more than 1 rule -> check if there could be a username in the title at all so that we do not run too many regexes
        return;
    }
    for (const rule of github.showNames.documentTitle.rules) {
        const regex = new RegExp(`${rule.prefix}(?<userId>${github.showNames.documentTitle.userIdRegex})${rule.suffix}`);
        const regexResult = regex.exec(title);
        if (regexResult) {
            const username = await _getUsername(regexResult.groups.userId);
            if (document.title === title) {
                // make sure title has not changed in the meantime
                const newTitle = title.replace(
                    regex,
                    `${rule.prefixReplace === undefined ? rule.prefix : rule.prefixReplace}${username}${rule.suffixReplace === undefined ? rule.suffix : rule.suffixReplace
                    }`
                );
                document.title = newTitle;
                documentTitleUserIdState.newTitle = newTitle;
                break;
            }
        }
    }
}
function showGitHubIdsAgainInDocumentTitle() {
    if (documentTitleUserIdState.intervalId !== null) {
        clearInterval(documentTitleUserIdState.intervalId);
        documentTitleUserIdState.intervalId = null;
    }
    if (documentTitleUserIdState.oldTitle) document.title = documentTitleUserIdState.oldTitle;
}

const usernameCacheName = `gh-usernameCache-${url.host}`;
let usernameCache;
let timeoutIdSavingUsernameCache = null;
function saveUsernameCacheToStorage() {
    if (!timeoutIdSavingUsernameCache) {
        timeoutIdSavingUsernameCache = setTimeout(() => {
            timeoutIdSavingUsernameCache = null;
            saveToStorage(usernameCacheName, usernameCache);
        }, 1000);
    }
}
function deleteLegacyUsernameCache() {
    return new Promise(function (resolve) {
        execAsync(browser.storage.local.remove.bind(browser.storage.local), "usernameCache", () => {
            resolve();
        });
    });
}

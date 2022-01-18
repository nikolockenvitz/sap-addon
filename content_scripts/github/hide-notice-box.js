github.flashNotice = {
    optionName: "github-hide-notice-overlay",
    query: ".flash.flash-full.js-notice.flash-warn.flash-length-limited",
};

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

let noticeBoxMessagesToHide = {};
function saveNoticeBoxMessagesToHideToStorage() {
    return saveToStorage("githubNoticeBoxMessagesToHide", noticeBoxMessagesToHide);
}

let usePromisesForAsync = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
}

let sap = {
    portal: {
        hostname: "portal.wdf.sap.corp",
        redirect: {
            optionName: "portal-redirect",
            pathnamesFrom: ["/", "/home"],
            pathnameTo: "/irj/portal"
        },
        searchbar: {
            optionName: "portal-focus-searchbar",
            searchbarId: "uhGlobalSearch"
        }
    },
    github: {
        hostname: "github.wdf.sap.corp",
        signIn: {
            optionName: "github-sign-in",
            query: "a[href^='/login?']"
        },
        flashNotice: {
            optionName: "github-hide-notice",
            queries: [".flash.flash-full.js-notice.flash-warn.flash-length-limited"]
        },
        showNames: {
            optionName: "github-show-names",
            query: ".user-mention, [data-hovercard-type=user]",
            regexNameOnProfilePage: `<span class="p-name vcard-fullname d-block overflow-hidden" itemprop="name">([^<]*)</span>`
        }
    }
};

sap.portal.redirect.redirect = function () {
    redirectToURL(sap.portal.redirect.pathnameTo);
};

sap.portal.searchbar.focus = function () {
    let intervalId = setInterval(function () {
        let searchbar = document.getElementById(sap.portal.searchbar.searchbarId);
        if (searchbar) { searchbar.focus(); }
    }, 250);
    executeFunctionAfterPageLoaded(function () {
        let searchbar = document.getElementById(sap.portal.searchbar.searchbarId);
        clearInterval(intervalId);
        // sometimes the focus gets resetted when executing directly
        let timesOfExecution = 5;
        function focus () {
            searchbar.focus();
            if (--timesOfExecution > 0) {
                setTimeout(focus, 250);
            }
        }
        focus();
    });
};


sap.github.signIn.signIn = function () {
    executeFunctionAfterPageLoaded(function () {
        // TODO: .signed-in-tab-flash
        let signInBtn = document.querySelector(sap.github.signIn.query);
        if (signInBtn) { signInBtn.click(); }
    });
};

sap.github.flashNotice.hide = function () {
    executeFunctionAfterPageLoaded(function () {
        _setDisplayAttrOfMatchingElements(sap.github.flashNotice.queries, "none");
    });
};

sap.github.flashNotice.show = function () {
    executeFunctionAfterPageLoaded(function () {
        _setDisplayAttrOfMatchingElements(sap.github.flashNotice.queries, "");
    });
};

let _setDisplayAttrOfMatchingElements = function (queries, displayValue) {
    for (let query of queries) {
        document.querySelector(query).style.display = displayValue;
    }
};

sap.github.showNames.replaceIds = function () {
    executeFunctionAfterPageLoaded(function () {
        /* execute once in cases where observer is not registered before
         * elements are changed/created (e.g. gets enabled in options)
         */
        sap.github.showNames._replaceAllChildsWhichAreUserId(document.body);
    });

    const observer = new MutationObserver((mutations, _observer) => {
        for (let { target } of mutations) {
            sap.github.showNames._replaceAllChildsWhichAreUserId(target);
        }
    });
    observer.observe(document.body, {
        childList: true,
        characterData: true,
        subtree: true
    });
};
sap.github.showNames.showIdsAgain = function () {
    for (let element of document.querySelectorAll("[data-sap-addon-user-id]")) {
        element.textContent = element.getAttribute("data-sap-addon-user-id");
        element.removeAttribute("data-sap-addon-user-id");
    }
};
sap.github.showNames._replaceAllChildsWhichAreUserId = function (element) {
    for (let queryMatch of element.querySelectorAll(sap.github.showNames.query)) {
        sap.github.showNames._replaceElementIfUserId(queryMatch);
    }
};
sap.github.showNames._replaceElementIfUserId = async function (element) {
    const userId = sap.github.showNames._getUserIdIfElementIsUserId(element);
    if (userId) {
        // TODO: can userId be an already replaced id? then it would be the name already 
        let username = await sap.github.showNames._getUsername(userId);
        if (username) {
            element.textContent = username;
            element.setAttribute("data-sap-addon-user-id", userId);
        }
    }
};
sap.github.showNames._getUserIdIfElementIsUserId = function (element) {
    return (element.childNodes.length === 1
        && element.firstChild.nodeName === "#text"
        && !element.hasAttribute("data-sap-addon-user-id") ? element.textContent : null);
};
sap.github.showNames._getUsername = function (userId) {
    // TODO: further caching needed?
    return new Promise(async function (resolve, reject) {
        fetch("https://" + sap.github.hostname + "/" + userId, {
            method: "GET",
            cache: "force-cache"
        }).then(response => response.text())
        .then(html => {
            const searchRegex = new RegExp(sap.github.showNames.regexNameOnProfilePage);
            const match = searchRegex.exec(html);
            resolve(match[1]);
        }).catch(error => {
            console.log("SAP Addon", error);
            resolve(null); // reject?
        });
    });
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
        function onLocalStorageGet (res) {
            options = res.options;
            resolve();
        }
        if (usePromisesForAsync) {
            browser.storage.local.get("options").then(onLocalStorageGet);
        } else {
            browser.storage.local.get("options", onLocalStorageGet);
        }
    });
};

let isEnabled = function (optionName) {
    return !options || options[optionName] !== false; // enabled per default
};

let url = new URL(window.location.href);

async function main () {
    await loadOptionsFromStorage();

    switch (url.hostname) {
        case sap.portal.hostname:
            if (isEnabled(sap.portal.redirect.optionName) && sap.portal.redirect.pathnamesFrom.includes(url.pathname)) {
                sap.portal.redirect.redirect();
            }
            if (isEnabled(sap.portal.searchbar.optionName)) {
                sap.portal.searchbar.focus();
            }
            break;
        case sap.github.hostname:
            if (isEnabled(sap.github.signIn.optionName)) {
                sap.github.signIn.signIn();
            }
            if (isEnabled(sap.github.flashNotice.optionName)) {
                sap.github.flashNotice.hide();
            } else {
                sap.github.flashNotice.show();
            }
            if (isEnabled(sap.github.showNames.optionName)) {
                sap.github.showNames.replaceIds();
            } else {
                sap.github.showNames.showIdsAgain();
            }
            break;
    }
};
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

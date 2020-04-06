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
            query: "a[href^='/login?']",
            signInOtherTabQuery: ".js-stale-session-flash-signed-in a"
        },
        flashNotice: {
            optionName: "github-hide-notice",
            query: ".flash.flash-full.js-notice.flash-warn.flash-length-limited"
        },
        showNames: {
            optionName: "github-show-names",
            query: ".user-mention, [data-hovercard-type=user]",
            regexNameOnProfilePage: `<span class="p-name vcard-fullname d-block overflow-hidden" itemprop="name">([^<]*)</span>`
        },
        getNamesFromPeople: {
            optionName: "github-get-names-from-people",
            regexNameOnProfilePage: `<span class='salutation'>[^<]*</span>([^<]*)<`
        }
    },
    people: {
        hostname: "people.wdf.sap.corp"
    }
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
        this.observerCallbacks[id] = undefined;
    }
}
const domObserver = new DOMObserver();

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
        sap.github.signIn.getSignInButtonAndClick();
    });

    domObserver.registerCallbackFunction(sap.github.signIn.optionName,
    function (mutations, _observer) {
        for (let { target } of mutations) {
            sap.github.signIn.getSignInButtonAndClick(target);
        }
    });
};
sap.github.signIn.getSignInButtonAndClick = function (element) {
    element = element || document;
    let signInBtn = element.querySelector(sap.github.signIn.query);
    if (signInBtn) { signInBtn.click(); }
};
sap.github.signIn.stopAutoSignIn = function () {
    domObserver.unregisterCallbackFunction(sap.github.signIn.optionName);
};
sap.github.signIn.listenForSignInOtherTab = function () {
    /* when also non-active tabs are notified that settings changed and user
     * should get signed in, these tabs will be redirected to
     * github.wdf.sap.corp/saml/consume which throws a 404
     * -> only regularly checking works, maybe can be combined with mutation observer
     */
    setInterval(async function () {
        await loadOptionsFromStorage();
        if (isEnabled(sap.github.signIn.optionName)) {
            let signInBtn = document.querySelector(sap.github.signIn.signInOtherTabQuery);
            if (signInBtn) {
                let r = signInBtn.getBoundingClientRect();
                if (r.width !== 0 && r.height !== 0) {
                    signInBtn.click();
                }
            }
        }
    }, 2500);
};

sap.github.flashNotice.hide = function () {
    executeFunctionAfterPageLoaded(function () {
        _hideElementsByQuery(sap.github.flashNotice.query);
    });

    domObserver.registerCallbackFunction(sap.github.flashNotice.optionName,
    function (mutations, _observer) {
        for (let { target } of mutations) {
            _hideElementsByQuery(sap.github.flashNotice.query, target);
        }
    });
};

sap.github.flashNotice.show = function () {
    domObserver.unregisterCallbackFunction(sap.github.flashNotice.optionName);
    executeFunctionAfterPageLoaded(function () {
        _showElementsByQuery(sap.github.flashNotice.query);
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
    for (let element of baseElement.querySelectorAll(query)) {
        element.style.display = displayValue;
    }
};

sap.github.showNames.replaceIds = function () {
    executeFunctionAfterPageLoaded(function () {
        /* execute once in cases where observer is not registered before
         * elements are changed/created (e.g. gets enabled in options)
         */
        sap.github.showNames._replaceAllChildsWhichAreUserId(document.body);
    });

    domObserver.registerCallbackFunction(sap.github.showNames.optionName,
    function (mutations, _observer) {
        for (let { target } of mutations) {
            sap.github.showNames._replaceAllChildsWhichAreUserId(target);
        }
    });
};
sap.github.showNames.showIdsAgain = function () {
    domObserver.unregisterCallbackFunction(sap.github.showNames.optionName);
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
    const {userId, prefix} = sap.github.showNames._getUserIdIfElementIsUserId(element);
    if (userId) {
        let username = await sap.github.showNames._getUsername(userId);
        if (username) {
            element.textContent = prefix + username;
            element.setAttribute("data-sap-addon-user-id", prefix + userId);
        }
    }
};
sap.github.showNames._getUserIdIfElementIsUserId = function (element) {
    let userId = (element.childNodes.length === 1
        && element.firstChild.nodeName === "#text"
        && !element.hasAttribute("data-sap-addon-user-id") ? element.textContent : null);
    if (userId && element.classList.contains("user-mention") && userId.startsWith("@")) {
        return { prefix: "@", userId: userId.substr(1) };
    }
    return { prefix: "", userId };
};
sap.github.showNames._getUsername = function (userId) {
    // TODO: further caching needed?
    return new Promise(async function (resolve, reject) {
        if (isEnabled(sap.github.getNamesFromPeople.optionName)) {
            fetch("https://" + sap.people.hostname + "/profiles/" + userId, {
                method: "GET",
                cache: "force-cache"
            }).then(response => response.text())
            .then(html => {
                const searchRegex = new RegExp(sap.github.getNamesFromPeople.regexNameOnProfilePage);
                let match = searchRegex.exec(html)[1];
                /* currently the salutation is not in the span which is named
                 * salutation but direclty in front of the name -> we need
                 * to split that away
                 * e.g.: <span class='salutation'></span>Mr. Firstname Lastname
                 */
                match = match.split(". ").pop().trim();
                resolve(match);
            }).catch(error => {
                console.log("SAP Addon", error);
            });
        }

        // use github as fallback or if people is disabled
        fetch("https://" + sap.github.hostname + "/" + userId, {
            method: "GET",
            cache: "force-cache"
        }).then(response => response.text())
        .then(html => {
            const searchRegex = new RegExp(sap.github.showNames.regexNameOnProfilePage);
            const match = searchRegex.exec(html)[1];
            resolve(match);
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
            } else {
                sap.github.signIn.stopAutoSignIn();
            }
            sap.github.signIn.listenForSignInOtherTab();
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

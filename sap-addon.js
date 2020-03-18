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
        }
    },
    github: {
        hostname: "github.wdf.sap.corp",
        flashNotice: {
            optionName: "github-hide-notice",
            queries: [".flash.flash-full.js-notice.flash-warn.flash-length-limited"]
        }
    }
};

sap.portal.redirect.redirect = function () {
    redirectToURL(sap.portal.redirect.pathnameTo);
};

sap.github.flashNotice.hide = function () {
    _setDisplayAttrOfMatchingElements(sap.github.flashNotice.queries, "none");
};

sap.github.flashNotice.show = function () {
    _setDisplayAttrOfMatchingElements(sap.github.flashNotice.queries, "");
};

let _setDisplayAttrOfMatchingElements = function (queries, displayValue) {
    for (let query of queries) {
        document.querySelector(query).style.display = displayValue;
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
        // is it possible that page is loaded before event listener is registered?
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
            break;
        case sap.github.hostname:
            if (isEnabled(sap.github.flashNotice.optionName)) {
                executeFunctionAfterPageLoaded(sap.github.flashNotice.hide);
            } else {
                executeFunctionAfterPageLoaded(sap.github.flashNotice.show);
            }
            break;
    }
};
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

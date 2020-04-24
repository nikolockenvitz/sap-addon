let usePromisesForAsync = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
}
let url = new URL(window.location.href);

let portal = {
    redirect: {
        optionName: "portal-redirect",
        pathnamesFrom: ["/", "/home"],
        pathnameTo: "/irj/portal",
    },
    searchbar: {
        optionName: "portal-focus-searchbar",
        searchbarId: "uhGlobalSearch",
    },
};

portal.redirect.redirect = function () {
    redirectToURL(portal.redirect.pathnameTo);
};

portal.searchbar.focus = function () {
    let intervalId = setInterval(function () {
        let searchbar = document.getElementById(portal.searchbar.searchbarId);
        if (searchbar) { searchbar.focus(); }
    }, 250);
    executeFunctionAfterPageLoaded(function () {
        let searchbar = document.getElementById(portal.searchbar.searchbarId);
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

async function main () {
    await loadOptionsFromStorage();

    if (isEnabled(portal.redirect.optionName) && portal.redirect.pathnamesFrom.includes(url.pathname)) {
        portal.redirect.redirect();
    }
    if (isEnabled(portal.searchbar.optionName)) {
        portal.searchbar.focus();
    }
};
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

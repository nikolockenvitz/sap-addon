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
const url = new URL(window.location.href);

const portal = {
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
    const intervalId = setInterval(function () {
        const searchbar = document.getElementById(portal.searchbar.searchbarId);
        if (searchbar) { searchbar.focus(); }
    }, 250);
    executeFunctionAfterPageLoaded(function () {
        const searchbar = document.getElementById(portal.searchbar.searchbarId);
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




function redirectToURL (url) {
    window.location.replace(url);
};

function executeFunctionAfterPageLoaded (func, args=[]) {
    window.addEventListener("load", () => {
        func(...args);
    });
    if (document.readyState === "complete") {
        func(...args);
    }
};

let options = {};
function loadOptionsFromStorage () {
    return new Promise(function (resolve) {
        execAsync(browser.storage.local.get.bind(browser.storage.local), "options", (res) => {
            options = res.options || {};
            resolve();
        });
    });
};

function isEnabled (optionName) {
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

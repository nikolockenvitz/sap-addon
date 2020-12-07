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
        if (searchbar) {
            searchbar.focus();
        }
    }, 250);
    executeFunctionAfterPageLoaded(function () {
        const searchbar = document.getElementById(portal.searchbar.searchbarId);
        clearInterval(intervalId);
        // sometimes the focus gets resetted when executing directly
        let timesOfExecution = 5;
        function focus() {
            searchbar.focus();
            if (--timesOfExecution > 0) {
                setTimeout(focus, 250);
            }
        }
        focus();
    });
};

function redirectToURL(url) {
    window.location.replace(url);
}

function executeFunctionAfterPageLoaded(func, args = []) {
    window.addEventListener("load", () => {
        func(...args);
    });
    if (document.readyState === "complete") {
        func(...args);
    }
}

let options = {};

function isEnabled(optionName) {
    return !options || options[optionName] !== false; // enabled per default
}

async function main() {
    options = await loadFromStorage("options");

    if (isEnabled(portal.redirect.optionName) && portal.redirect.pathnamesFrom.includes(url.pathname)) {
        portal.redirect.redirect();
    }
    if (isEnabled(portal.searchbar.optionName)) {
        portal.searchbar.focus();
    }
}
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

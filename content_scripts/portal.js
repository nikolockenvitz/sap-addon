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

function redirectToMainPage () {
    redirectToURL(portal.redirect.pathnameTo);
}

function focusSearchbar () {
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
}

function redirectToURL(url) {
    window.location.replace(url);
}

let options = {};

async function main() {
    options = await loadFromStorage("options");

    if (isEnabled(portal.redirect.optionName) && portal.redirect.pathnamesFrom.includes(url.pathname)) {
        redirectToMainPage();
    }
    if (isEnabled(portal.searchbar.optionName)) {
        focusSearchbar();
    }
}
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

let sap = {
    github: { hostname: "github.wdf.sap.corp" },
    portal: { hostname: "portal.wdf.sap.corp", pathnamesFrom: ["/", "/home"], pathnameTo: "/irj/portal" }
};

sap.github.flashNoticeQueries = [
    ".flash.flash-full.js-notice.flash-warn.flash-length-limited"
];

sap.github.hideFlashNotice = function () {
    _setDisplayAttrOfMatchingElements(sap.github.flashNoticeQueries, "none");
};

sap.github.showFlashNotice = function () {
    _setDisplayAttrOfMatchingElements(sap.github.flashNoticeQueries, "");
};

let _setDisplayAttrOfMatchingElements = function (queries, displayValue) {
    for (let query of queries) {
        document.querySelector(query).style.display = displayValue;
    }
};

sap.portal.redirect = function () {
    window.location.replace(sap.portal.pathnameTo);
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

let url = new URL(window.location.href);

function main () {
    if (url.hostname === sap.github.hostname) {
        executeFunctionAfterPageLoaded(sap.github.hideFlashNotice);
    } else if (url.hostname === sap.portal.hostname && sap.portal.pathnamesFrom.includes(url.pathname)) {
        sap.portal.redirect();
    }
}
main();

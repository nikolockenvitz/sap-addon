// wait until page is loaded
window.onload = function() {
    // page load is not enough, because the side panel is loaded dynamically
    const observer = new MutationObserver((mutationsList, observer) => {
        // wait until the side panel is loaded
        const targetElement = document.querySelector('[data-testid="comment-body"] a');
        if (targetElement) {
            // do not disconnect, because the user can change to another dynamic side-panel
            //observer.disconnect(); 
            // call business logic to replace relative urls with absolute urls
            replaceUrl();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function replaceUrl() {
    // check whether we are on a github projects page
    if (window.location.href.includes("/projects/")) {
        // get the base url from the side panel title's anchor element
        const baseUrl = getBaseUrlOfRepo();
        if (null != baseUrl) {
            // select the comment body of the side panel
            const targetElement = document.querySelector('[data-testid="comment-body"]');
            if (targetElement) {
                const anchors = targetElement.querySelectorAll('a');
                for (const anchor of anchors) {
                    // check whether the anchor element is a link to a pull request
                    // and whether it is not already an absolute url
                    if (anchor.href.includes('/pull/') && !anchor.href.includes(baseUrl)) {
                        // read existing url
                        const oldUrl = anchor.getAttribute('href');
                        // extract the part of the pull request, e.g. /pull/1234
                        const pullUrl = oldUrl.substring(oldUrl.indexOf('/pull/'), oldUrl.length)
                        // concantenate the base url with the pull request url
                        const newUrl = baseUrl + pullUrl;
                        // set the new url to the anchor element
                        anchor.setAttribute('href', newUrl);
                    }
                }
            }
        }
    }
}

function getBaseUrlOfRepo() {
    const targetElement = document.querySelector('[data-testid="side-panel-title-content"]');
    let href = null;
    if (targetElement) {
        const anchorElement = targetElement.querySelector('a');
        if (anchorElement) {
            href = anchorElement.href;
        }
    }

    let baseUrl = null;
    if (null != href) {
        baseUrl = href.substring(0, href.indexOf('/issues'));
    }

    return baseUrl;
}

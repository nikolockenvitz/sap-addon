github.projectIssueRelativeLinkRewrite = {
    optionName: "github-project-rewrite-issue-rel-links",
    queryCommentBodyLink: '[data-testid="comment-body"] a',
    queryCommentBody: '[data-testid="comment-body"]',
    querySidePanelTitle: '[data-testid="side-panel-title-content"]',
};

function startRewritingRelativeLinksInProjectIssues() {
    executeFunctionAfterPageLoaded(function () {
        replaceApplicableRelativeUrls();
    });
    domObserver.registerCallbackFunction(github.projectIssueRelativeLinkRewrite.optionName, () => {
        replaceApplicableRelativeUrls();
    });
}

function stopRewritingRelativeLinksInProjectIssues() {
    domObserver.disconnect();
    domObserver.unregisterCallbackFunction(github.projectIssueRelativeLinkRewrite.optionName);
}

function replaceApplicableRelativeUrls() {
    // check whether we are on a github projects page
    if (!window.location.href.includes("/projects/")) {
        return;
    }
    // get the base url from the side panel title's anchor element
    const baseUrl = getBaseUrlOfRepo();
    if (null == baseUrl) {
        return;
    }
    // select the comment body of the side panel
    const targetElement = document.querySelector(github.projectIssueRelativeLinkRewrite.queryCommentBody);
    if (targetElement) {
        const anchors = targetElement.querySelectorAll("a");
        for (const anchor of anchors) {
            // check if the anchor element is a relative link (e.g., "../pull/123")
            // but we need to access the attribute directly (coz anchor.href is full/absolute link as interpreted by browser)
            const href = anchor.getAttribute("href");
            if (href.startsWith("../")) {
                // original issue URL is "<baseUrl>/issues/<#i>"
                // thus, in the repo, "../<x>" would become "<baseUrl>/<x>"
                const x = href.substring(3);
                const newUrl = baseUrl + "/" + x;
                // set the new url to the anchor element
                anchor.setAttribute("href", newUrl);
            }
        }
    }
}

function getBaseUrlOfRepo() {
    const targetElement = document.querySelector(github.projectIssueRelativeLinkRewrite.querySidePanelTitle);
    let href = null;
    if (targetElement) {
        const anchorElement = targetElement.querySelector("a");
        if (anchorElement) {
            href = anchorElement.href;
        }
    }

    let baseUrl = null;
    if (null != href) {
        baseUrl = href.substring(0, href.indexOf("/issues"));
    }

    return baseUrl;
}

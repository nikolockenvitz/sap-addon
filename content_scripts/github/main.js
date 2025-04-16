let options;

async function main() {
    deleteLegacyUsernameCache();
    [usernameCache, options, noticeBoxMessagesToHide] = await Promise.all([
        loadFromStorage(usernameCacheName),
        loadFromStorage("options"),
        loadFromStorage("githubNoticeBoxMessagesToHide"),
    ]);

    if (isEnabled(github.signIn.optionName)) {
        signIn();
    } else {
        stopAutoSignIn();
    }
    listenForSignInOtherTab();

    const insertOverlayToHideFlashNoticeEnabled = isEnabled(github.flashNotice.optionName);
    hideDismissedNoticeBoxesAndInsertHideOverlayIfEnabled(insertOverlayToHideFlashNoticeEnabled);
    if (!insertOverlayToHideFlashNoticeEnabled) {
        removeHideOverlayInNoticeBoxes();
    }

    if (isEnabled(github.showNames.optionName)) {
        replaceGitHubIdsWithUsername();
        replaceGitHubIdsWithUsernameInDocumentTitle();
    } else {
        showGitHubIdsAgain();
        showGitHubIdsAgainInDocumentTitle();
    }

    if (isEnabled(github.projectIssueRelativeLinkRewrite.optionName)) {
        startRewritingRelativeLinksInProjectIssues();
    } else {
        // we stop rewriting links (but we don't revert existing rewritten links; user page reload is sufficient)
        stopRewritingRelativeLinksInProjectIssues();
    }
}
main();
browser.runtime.onConnect.addListener(() => {
    main();
});
browser.runtime.onMessage.addListener((message) => {
    if (message.message === "github-hide-notice-show-all-again") {
        showAllNoticeBoxesAgain();
    }
});

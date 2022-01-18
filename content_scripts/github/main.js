let options;

async function main() {
    [usernameCache, options, noticeBoxMessagesToHide] = await Promise.all([
        loadFromStorage("usernameCache"),
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
    } else {
        showGitHubIdsAgain();
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

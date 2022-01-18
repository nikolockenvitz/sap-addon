github.signIn = {
    optionName: "github-sign-in",
    query: "div.auth-form-body > a.btn-primary[href^='/login?'], header a.HeaderMenu-link[href^='/login?']",
    signInOtherTabQuery: ".js-stale-session-flash-signed-in a",
    urlPath: "/login",
};

function signIn() {
    if (url.pathname === github.signIn.urlPath) {
        executeFunctionAfterPageLoaded(function () {
            getSignInButtonAndClick();
        });
    }

    domObserver.registerCallbackFunction(github.signIn.optionName, function (mutations, _observer) {
        for (const { target } of mutations) {
            getSignInButtonAndClick(target);
        }
    });
}
// the handler to click on the button will be invoked a lot (>30) -> setting a flag after the first click prevents this
// but this needs to be time-bound, otherwise there will be no sign in after automatic logout
let alreadyClickedSignButtonAt = 0;
const DELAY_BEFORE_CLICKING_SIGNIN_BUTTON_AGAIN = 15 * 1000;
function getSignInButtonAndClick(element) {
    element = element && element.querySelector ? element : document;
    try {
        const signInBtn = element.querySelector(github.signIn.query);
        if (signInBtn && signInBtn.click && Date.now() - alreadyClickedSignButtonAt > DELAY_BEFORE_CLICKING_SIGNIN_BUTTON_AGAIN) {
            alreadyClickedSignButtonAt = Date.now();
            setTimeout(function () {
                signInBtn.click();
            }, 100); // when click is executed directly, github.tools.sap crashes in chrome
        }

        // there's a redirect during login; in case redirects are blocked by the browser: click link
        const redirectLink = getSignInRedirectLink(element);
        if (redirectLink && redirectLink.click) {
            redirectLink.click();
        }
    } catch {}
}
function getSignInRedirectLink(element) {
    const redirectLink = element.querySelector("a#redirect[href^='https://accounts.sap.com/']");
    return redirectLink && url.pathname === "/login" ? redirectLink : null;
}
function stopAutoSignIn() {
    domObserver.unregisterCallbackFunction(github.signIn.optionName);
}
let signInOtherTabInterval = null;
function listenForSignInOtherTab() {
    /* when also non-active tabs are notified that settings changed and user
     * should get signed in, these tabs will be redirected to
     * github.wdf.sap.corp/saml/consume which throws a 404
     * -> only regularly checking works, maybe can be combined with mutation observer
     */
    if (signInOtherTabInterval) return;
    signInOtherTabInterval = setInterval(async function () {
        options = await loadFromStorage("options");
        if (isEnabled(github.signIn.optionName)) {
            const signInBtn = document.querySelector(github.signIn.signInOtherTabQuery);
            if (signInBtn) {
                const r = signInBtn.getBoundingClientRect();
                if (r.width !== 0 && r.height !== 0) {
                    signInBtn.click();
                }
            }
        }
    }, 2500);
}

const artifactory = {
    login: {
        mainNodeId: "single-spa-application:@jfrog/ui-platform-microfrontend-client",
        urlPaths: ["/ui/login", "/ui/login/"],
        optionName: "artifactory-login",
        samlSsoBtnQuery: "div.additional-signin button.login-provider-button",
        queryDistinctElementAfterLogin: "span.welcome-container",
        // note: for the internal instance, we could also check for div.login-container
    },
};

function executeLogin() {
    executeFunctionAfterPageLoaded(getSamlSsoButtonAndClick);
    domObserver.registerCallbackFunction(artifactory.login.optionName, function (_mutations, _observer) {
        getSamlSsoButtonAndClick();
    });
}
function getSamlSsoButtonAndClick() {
    try {
        const samlSsoBtn = document.querySelector(artifactory.login.samlSsoBtnQuery);
        if (samlSsoBtn && samlSsoBtn.click) {
            samlSsoBtn.click();
            stopAutoSignIn();
        } else if (document.querySelector(artifactory.login.queryDistinctElementAfterLogin) !== null) {
            stopAutoSignIn();
        }
    } catch {}
}

function stopAutoSignIn() {
    domObserver.unregisterCallbackFunction(artifactory.login.optionName);
}

let options = {};

async function main() {
    // note: we cannot check for the URL path easily because the SPA mutates it
    options = await loadFromStorage("options");
    if (isEnabled(artifactory.login.optionName)) {
        executeLogin();
    }
}
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

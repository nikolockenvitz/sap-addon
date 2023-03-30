const mural = {
    login: {
        urlPathsSignIn: ["/signin", "/signin-join-mural"],
        configNameEmailAddress: "config-email",
        optionName: "mural-login",
        queryEmailInput: "mrl-text-input > div > input#work-email-signin[type=text][name=email]",
        querySignInButton: "mrl-button#button-signin button[type=submit]",

        urlPathNotFound: "/not-found",
        notFoundPageQuerySignInButton: "div.ui-error-page-box-content a",
        notFoundPageSignInButtonTextContent: "Sign in",
    },
};

function executeLogin() {
    function login() {
        const url = new URL(window.location.href);
        if (url.pathname === mural.login.urlPathNotFound) {
            // not found page "Uh-oh, we can't find that page" / "Page not found"
            // -> click on "Sign in" button to get to next screen
            const btn = findSignInButtonOnNotFoundPage();
            if (btn) {
                _clickButton(btn);
            }
        } else if (mural.login.urlPathsSignIn.includes(url.pathname)) {
            // sign in page -> enter email and click on button
            const emailInput = document.querySelector(mural.login.queryEmailInput);
            const btn = document.querySelector(mural.login.querySignInButton);
            if (emailInput && btn) {
                _enterEmailAndClickNext(emailInput, btn);
                return stopAutoSignIn();
            }
        }
    }

    executeFunctionAfterPageLoaded(login);
    domObserver.registerCallbackFunction(mural.login.optionName, function (_mutations, _observer) {
        login();
    });
}

function findSignInButtonOnNotFoundPage() {
    const btns = document.querySelectorAll(mural.login.notFoundPageQuerySignInButton);
    for (const btn of btns) {
        if (btn.textContent === mural.login.notFoundPageSignInButtonTextContent) {
            return btn;
        }
    }
    return null;
}

function _enterEmailAndClickNext(emailInput, btn) {
    const configEmail = config[mural.login.configNameEmailAddress];
    if (emailInput.value === "") {
        if (configEmail) {
            _setReactInputValue(emailInput, configEmail);
            _clickButton(btn);
            stopAutoSignIn();
            return true;
        }
        // TODO: insert/show notice to configure email in addon?
    } else if (emailInput.value === configEmail) {
        _clickButton(btn);
        stopAutoSignIn();
        return true;
    }
    return false;
}
function _setReactInputValue(input, value) {
    // uff wtf
    // https://stackoverflow.com/questions/30683628/react-js-setting-value-of-input
    function setNativeValue(element, value) {
        let lastValue = element.value;
        element.value = value;
        let event = new Event("input", { target: element, bubbles: true });
        // React 15
        event.simulated = true;
        // React 16
        let tracker = element._valueTracker;
        if (tracker) {
            tracker.setValue(lastValue);
        }
        element.dispatchEvent(event);
    }
    setNativeValue(input, value);
}
function _clickButton(btn) {
    btn.click();
}

function stopAutoSignIn() {
    domObserver.unregisterCallbackFunction(mural.login.optionName);
}

let options = {};
let config = {};

async function main() {
    [options, config] = await Promise.all([loadFromStorage("options"), loadFromStorage("config")]);

    if (isEnabled(mural.login.optionName)) {
        executeLogin();
        // stop autologin after 15 seconds to not run unnecessarily
        setTimeout(stopAutoSignIn, 15 * 1000);
        // TODO: could also check whether already logged in via document.cookie (murally.jwt)
    }
}
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

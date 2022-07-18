const mural = {
    login: {
        urlPath: "/signin",
        configNameEmailAddress: "config-email",
        optionName: "mural-login",
        queryEmailInput: "#registration-signin input[type=email]",
        querySignInButton: "button#registration-signin-submit",
    },
};

function executeLogin() {
    function login() {
        if (new URL(window.location.href).pathname !== mural.login.urlPath) return;

        const emailInput = document.querySelector(mural.login.queryEmailInput);
        const btn = document.querySelector(mural.login.querySignInButton);
        if (emailInput && btn) {
            _enterEmailAndClickNext(emailInput, btn);
            return stopAutoSignIn();
        }
    }

    executeFunctionAfterPageLoaded(login);
    domObserver.registerCallbackFunction(mural.login.optionName, function (_mutations, _observer) {
        login();
    });
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

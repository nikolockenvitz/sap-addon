let usePromisesForAsync = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
}
function execAsync (asyncFunction, args, callback) {
    if (!Array.isArray(args)) args = [args];
    if (usePromisesForAsync) {
        asyncFunction(...args).then(callback);
    } else {
        asyncFunction(...args, callback);
    }
}
const url = new URL(window.location.href);

const sharepoint = {
    login: {
        optionName: "sharepoint-login",
        configNameEmailAddress: "config-email",
        sharepointOnlyClickNextBtnQuery: `div.form-input-container input[type=button][name=btnSubmitSignIn][value=Next]#btnSubmitSignIn.form-submit.disable-on-submit`,
        microsoftonlineSelectAccount: `#tilesHolder div.tile-container div.row.tile div.table div.table-row div.table-cell div`,
        sharepointEnterEmailAndClickNextInputQuery: `#TOAAEmailEntryControls div.form-input-container input#txtTOAAEmail[type=email]`,
        sharepointEnterEmailAndClickNextBtnQuery: `#TOAAEmailEntryControls div.form-input-container input#btnSubmitEmail[type=button]`,
        microsoftonlineEnterEmailAndClickNextInputQuery: `div div.row div.form-group div.placeholderContainer input[type=email]`,
        microsoftonlineEnterEmailAndClickNextBtnQuery: `div div.win-button-pin-bottom div.row div div div input[type=submit][value=Next]`,
    },
};

class DOMObserver {
    constructor () {
        this.observerCallbacks = {};
        const that = this;
        this.observer = new MutationObserver(function (mutation, _observer) {
            for (const id in that.observerCallbacks) {
                that.observerCallbacks[id](mutation, _observer);
            }
        });
        this.observer.observe(document, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    registerCallbackFunction (id, callback) {
        if (!this.observerCallbacks[id]) {
            this.observerCallbacks[id] = callback;
        }
    }

    unregisterCallbackFunction (id) {
        delete this.observerCallbacks[id];
    }
}
const domObserver = new DOMObserver();

sharepoint.login.executeLogin = function () {
    function login () {
        let emailInput, btn;

        // sap-my.sharepoint.com, only button "Next" to continue
        btn = document.querySelector(sharepoint.login.sharepointOnlyClickNextBtnQuery);
        if (btn) {
            // could also be used to obtain email address: document.querySelector("#SigninControls div.form-message #lblSignInDescription span b").textContent
            sharepoint.login._clickButton(btn);
            return sharepoint.login.stopAutoSignIn();
        }

        // login.microsoftonline.com, only to select first email address to continue
        btn = document.querySelector(sharepoint.login.microsoftonlineSelectAccount);
        if (btn) {
            // could also be used to obtain email address (btn.textContent)
            sharepoint.login._clickButton(btn);
            return sharepoint.login.stopAutoSignIn();
        }

        // sap-my.sharepoint.com, email input + button "Next" to continue
        emailInput = document.querySelector(sharepoint.login.sharepointEnterEmailAndClickNextInputQuery);
        btn = document.querySelector(sharepoint.login.sharepointEnterEmailAndClickNextBtnQuery);
        if (emailInput && btn) {
            sharepoint.login._enterEmailAndClickNext(emailInput, btn);
            return sharepoint.login.stopAutoSignIn();
        }

        // login.microsoftonline.com, email input + button "Next" to continue
        emailInput = document.querySelector(sharepoint.login.microsoftonlineEnterEmailAndClickNextInputQuery);
        btn = document.querySelector(sharepoint.login.microsoftonlineEnterEmailAndClickNextBtnQuery);
        if (emailInput && btn) {
            sharepoint.login._enterEmailAndClickNext(emailInput, btn);
            return sharepoint.login.stopAutoSignIn();
        }
    };

    executeFunctionAfterPageLoaded(login);
    domObserver.registerCallbackFunction(sharepoint.login.optionName,
        function (mutations, _observer) {
            login();
        }
    );
};
sharepoint.login._enterEmailAndClickNext = function (emailInput, btn) {
    const configEmail = config[sharepoint.login.configNameEmailAddress];
    if (emailInput.value === "") {
        if (configEmail) {
            emailInput.value = configEmail;
            emailInput.dispatchEvent(new Event('change'));
            emailInput.dispatchEvent(new Event('input'));
            sharepoint.login._clickButton(btn);
            sharepoint.login.stopAutoSignIn();
            return true;
        }
        // TODO: insert/show notice to configure email in addon?
    } else if (emailInput.value === configEmail) {
        sharepoint.login._clickButton(btn);
        sharepoint.login.stopAutoSignIn();
        return true;
    }
    return false;
};
sharepoint.login._clickButton = function (btn) {
    function click () {
        btn.click();
    }
    if (url.hostname === "login.microsoftonline.com") {
        setTimeout(click, 100);
    } else {
        click();
    }
};

sharepoint.login.stopAutoSignIn = function () {
    domObserver.unregisterCallbackFunction(sharepoint.login.optionName);
};

function executeFunctionAfterPageLoaded (func, args=[]) {
    window.addEventListener("load", () => {
        func(...args);
    });
    if (document.readyState === "complete") {
        func(...args);
    }
}

let options = {};
function loadOptionsFromStorage () {
    return new Promise(function (resolve) {
        execAsync(browser.storage.local.get.bind(browser.storage.local), "options", (res) => {
            options = res.options || {};
            resolve();
        });
    });
}

function isEnabled (optionName) {
    return !options || options[optionName] !== false; // enabled per default
}

let config = {};
function loadConfigFromStorage () {
    return new Promise(function (resolve) {
        execAsync(browser.storage.local.get.bind(browser.storage.local), "config", (res) => {
            config = res.config || {};
            resolve();
        });
    });
}

async function main () {
    await Promise.all([
        loadOptionsFromStorage(),
        loadConfigFromStorage(),
    ]);

    if (isEnabled(sharepoint.login.optionName)) {
        sharepoint.login.executeLogin();
    }
};
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

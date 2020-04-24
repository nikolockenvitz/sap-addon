let usePromisesForAsync = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
}
let url = new URL(window.location.href);

let sharepoint = {
    login: {
        optionName: "sharepoint-login",
        configNameEmailAddress: "config-email",
        sharepointOnlyClickNextBtnQuery: `div.form-input-container input[type=button][name=btnSubmitSignIn][value=Next]#btnSubmitSignIn.form-submit.disable-on-submit`,
        microsoftonlineSelectAccount: `#tilesHolder div.tile-container div.row.tile div.table div.table-row div.table-cell div`,
        sharepointEnterEmailAndClickNextInputQuery: `#TOAAEmailEntryControls div.form-input-container input#txtTOAAEmail[type=email]`,
        sharepointEnterEmailAndClickNextBtnQuery: `#TOAAEmailEntryControls div.form-input-container input#btnSubmitEmail[type=button]`,
    },
};

class DOMObserver {
    constructor () {
        this.observerCallbacks = {};
        let that = this;
        this.observer = new MutationObserver(function (mutation, _observer) {
            for (let id in that.observerCallbacks) {
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
        this.observerCallbacks[id] = undefined;
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
            btn.click();
            sharepoint.login.stopAutoSignIn();
            return;
        }

        // login.microsoftonline.com, only to select first email address to continue
        btn = document.querySelector(sharepoint.login.microsoftonlineSelectAccount);
        if (btn) {
            // could also be used to obtain email address (btn.textContent)
            setTimeout(function () {
                btn.click();
            }, 100); // clicking button directly didn't worked when testing
            sharepoint.login.stopAutoSignIn();
            return;
        }

        // sap-my.sharepoint.com, email input + button "Next" to continue
        emailInput = document.querySelector(sharepoint.login.sharepointEnterEmailAndClickNextInputQuery);
        btn = document.querySelector(sharepoint.login.sharepointEnterEmailAndClickNextBtnQuery);
        if (emailInput && btn) {
            let configEmail = config[sharepoint.login.configNameEmailAddress];
            if (emailInput.value === "") {
                if (configEmail) {
                    emailInput.value = configEmail;
                    btn.click();
                    return;
                }
                // TODO: insert notice to configure email in addon?
            } else if (emailInput.value === configEmail) {
                btn.click();
                sharepoint.login.stopAutoSignIn();
                return;
            }
        }
    };

    executeFunctionAfterPageLoaded(login);
    domObserver.registerCallbackFunction(sharepoint.login.optionName,
        function (mutations, _observer) {
            login();
        }
    );
};

sharepoint.login.stopAutoSignIn = function () {
    domObserver.unregisterCallbackFunction(sharepoint.login.optionName);
};

let executeFunctionAfterPageLoaded = function (func, args=[]) {
    window.addEventListener("load", (e) => {
        func(...args);
    });
    if (document.readyState === "complete") {
        func(...args);
    }
};

let options = {};
let loadOptionsFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        function onLocalStorageGet (res) {
            options = res.options;
            resolve();
        }
        if (usePromisesForAsync) {
            browser.storage.local.get("options").then(onLocalStorageGet);
        } else {
            browser.storage.local.get("options", onLocalStorageGet);
        }
    });
};

let isEnabled = function (optionName) {
    return !options || options[optionName] !== false; // enabled per default
};

let config = {};
let loadConfigFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        function onLocalStorageGet (res) {
            config = res.config;
            resolve();
        }
        if (usePromisesForAsync) {
            browser.storage.local.get("config").then(onLocalStorageGet);
        } else {
            browser.storage.local.get("config", onLocalStorageGet);
        }
    });
};

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

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

sharepoint.login.executeLogin = function () {
    // TODO: can be made even faster by using mutation observer
    executeFunctionAfterPageLoaded(function () {
        let emailInput, btn;

        // sap-my.sharepoint.com, only button "Next" to continue
        btn = document.querySelector(sharepoint.login.sharepointOnlyClickNextBtnQuery);
        if (btn) {
            // could also be used to obtain email address: document.querySelector("#SigninControls div.form-message #lblSignInDescription span b").textContent
            btn.click();
            return;
        }

        // login.microsoftonline.com, only to select first email address to continue
        btn = document.querySelector(sharepoint.login.microsoftonlineSelectAccount);
        if (btn) {
            // could also be used to obtain email address (btn.textContent)
            btn.click();
            return;
        }

        // sap-my.sharepoint.com, email input + button "Next" to continue
        emailInput = document.querySelector(sharepoint.login.sharepointEnterEmailAndClickNextInputQuery);
        btn = document.querySelector(sharepoint.login.sharepointEnterEmailAndClickNextBtnQuery);
        if (emailInput && btn) {
            if (emailInput.value === "") {
                let configEmail = config[sharepoint.login.configNameEmailAddress]
                if (configEmail) {
                    emailInput.value = configEmail;
                    btn.click();
                    return;
                }
                // TODO: insert notice to configure email in addon?
            } else {
                // TODO: hopefully not during typing?!
                btn.click();
                return;
            }
        }
    });
}

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

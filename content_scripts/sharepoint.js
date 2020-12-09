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

function executeLogin() {
    function login() {
        let emailInput, btn;

        // sap-my.sharepoint.com, only button "Next" to continue
        btn = document.querySelector(sharepoint.login.sharepointOnlyClickNextBtnQuery);
        if (btn) {
            // could also be used to obtain email address: document.querySelector("#SigninControls div.form-message #lblSignInDescription span b").textContent
            _clickButton(btn);
            return stopAutoSignIn();
        }

        // login.microsoftonline.com, only to select first email address to continue
        btn = document.querySelector(sharepoint.login.microsoftonlineSelectAccount);
        if (btn) {
            // could also be used to obtain email address (btn.textContent)
            _clickButton(btn);
            return stopAutoSignIn();
        }

        // sap-my.sharepoint.com, email input + button "Next" to continue
        emailInput = document.querySelector(sharepoint.login.sharepointEnterEmailAndClickNextInputQuery);
        btn = document.querySelector(sharepoint.login.sharepointEnterEmailAndClickNextBtnQuery);
        if (emailInput && btn) {
            _enterEmailAndClickNext(emailInput, btn);
            return stopAutoSignIn();
        }

        // login.microsoftonline.com, email input + button "Next" to continue
        emailInput = document.querySelector(sharepoint.login.microsoftonlineEnterEmailAndClickNextInputQuery);
        btn = document.querySelector(sharepoint.login.microsoftonlineEnterEmailAndClickNextBtnQuery);
        if (emailInput && btn) {
            _enterEmailAndClickNext(emailInput, btn);
            return stopAutoSignIn();
        }
    }

    executeFunctionAfterPageLoaded(login);
    domObserver.registerCallbackFunction(sharepoint.login.optionName, function (mutations, _observer) {
        login();
    });
}
function _enterEmailAndClickNext(emailInput, btn) {
    const configEmail = config[sharepoint.login.configNameEmailAddress];
    if (emailInput.value === "") {
        if (configEmail) {
            emailInput.value = configEmail;
            emailInput.dispatchEvent(new Event("change"));
            emailInput.dispatchEvent(new Event("input"));
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
function _clickButton(btn) {
    function click() {
        btn.click();
    }
    if (url.hostname === "login.microsoftonline.com") {
        setTimeout(click, 100);
    } else {
        click();
    }
}

function stopAutoSignIn() {
    domObserver.unregisterCallbackFunction(sharepoint.login.optionName);
}

let options = {};
let config = {};

async function main() {
    [options, config] = await Promise.all([loadFromStorage("options"), loadFromStorage("config")]);

    if (isEnabled(sharepoint.login.optionName)) {
        executeLogin();
    }
}
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

const pluralsight = {
    login: {
        mainUrlPath: "/id",
        loginUrlPath: "/id/signin/sso",
        optionName: "pluralsight-login",
        ssoOptionQuery: "a[href^='/id/signin/sso']",
        inputField: "#Alias",
        signInBtn: ".psds-button",
    },
};

function executeRedirect() {
    executeFunctionAfterPageLoaded(function () {
        getSsoOptionButtonAndClick();
    });
}
function getSsoOptionButtonAndClick() {
    try {
        const ssoOption = document.querySelector(pluralsight.login.ssoOptionQuery);
        if (ssoOption && ssoOption.click) {
            ssoOption.click();
        }
    } catch {}
}
function executeLogin() {
    executeFunctionAfterPageLoaded(function () {
        getInputAndFill();
        getSignInButtonAndClick();
    });
}
function getInputAndFill() {
    try {
        const inputField = document.querySelector(pluralsight.login.inputField);
        if (inputField) {
            inputField.value = "sap.com";
        }
    } catch {}
}
function getSignInButtonAndClick() {
    try {
        const signInBtn = document.querySelector(pluralsight.login.signInBtn);
        if (signInBtn && signInBtn.click) {
            signInBtn.click();
        }
    } catch {}
}

let options = {};

async function main() {
    if (url.pathname.startsWith(pluralsight.login.loginUrlPath)) {
        options = await loadFromStorage("options");
        if (isEnabled(pluralsight.login.optionName)) {
            executeLogin();
        }
    } else if (url.pathname.startsWith(pluralsight.login.mainUrlPath)) {
        options = await loadFromStorage("options");
        if (isEnabled(pluralsight.login.optionName)) {
            executeRedirect();
        }
    }
}
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

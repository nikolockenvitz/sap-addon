const stackenterprise = {
    login: {
        urlPath: "/users/login",
        optionName: "stackenterprise-login",
        query: "#formContainer > a.s-btn[href^='/users/samlstart?']",
    },
};

function executeLogin() {
    executeFunctionAfterPageLoaded(function () {
        getSignInButtonAndClick();
    });
}
function getSignInButtonAndClick() {
    try {
        const signInBtn = document.querySelector(stackenterprise.login.query);
        if (signInBtn && signInBtn.click) {
            signInBtn.click();
        }
    } catch {}
}

let options = {};

async function main() {
    if (url.pathname === stackenterprise.login.urlPath) {
        options = await loadFromStorage("options");
        if (isEnabled(stackenterprise.login.optionName)) {
            executeLogin();
        }
    }
}
main();
browser.runtime.onConnect.addListener(() => {
    main();
});

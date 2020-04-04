let usePromisesForAsync = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
}

const inputIds = [
    "portal-redirect", "portal-focus-searchbar",
    "github-sign-in", "github-hide-notice", "github-show-names", "github-get-names-from-people",
    "fiori-lunchmenu-german",
];

let options = {};

window.onload = async function () {
    await loadOptionsFromStorage();

    for (let inputId of inputIds) {
        toggleInputOnSectionTextClick(inputId); // sectionText includes also the input itself
    }
    initInputs();
};

let onChangeInput = async function (inputId) {
    options[inputId] = document.getElementById(inputId).checked;
    await saveOptionsToStorage();
    function onTabsQuery (tabs) {
        for (let tab of tabs) {
            // connect will trigger main function of sap-addon.js
            browser.tabs.connect(tab.id).disconnect();
        }
    }
    function onBackgroundWindow (backgroundWindow) {
        backgroundWindow.main();
    }
    if (usePromisesForAsync) {
        browser.tabs.query({currentWindow: true, active: true}).then(onTabsQuery);
        browser.runtime.getBackgroundPage().then(onBackgroundWindow);
    } else {
        browser.tabs.query({currentWindow: true, active: true}, onTabsQuery);
        browser.runtime.getBackgroundPage(onBackgroundWindow);
    }
};

let toggleInputOnSectionTextClick = function (inputId) {
    let inputEl = document.getElementById(inputId);
    let el = inputEl;
    while (el) {
        el = el.parentElement;
        if (el.classList.contains('section-text')) {
            el.addEventListener("click", function (event) {
                inputEl.checked = !inputEl.checked;
                onChangeInput(inputId);
            });
            break;
        }
    }
};


let loadOptionsFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        function onLocalStorageGet (res) {
            options = res.options || {};
            resolve();
        }
        if (usePromisesForAsync) {
            browser.storage.local.get('options').then(onLocalStorageGet);
        } else {
            browser.storage.local.get('options', onLocalStorageGet);
        }
    });
};

let saveOptionsToStorage = function () {
    return new Promise(async function (resolve, reject) {
        function onLocalStorageSet () {
            resolve();
        }
        if (usePromisesForAsync) {
            browser.storage.local.set({options: options}).then(onLocalStorageSet);
        } else {
            browser.storage.local.set({options: options}, onLocalStorageSet);
        }
    });
};

let initInputs = function () {
    for (let inputId of inputIds) {
        document.getElementById(inputId).checked = (!options || options[inputId] !== false);
    }
};
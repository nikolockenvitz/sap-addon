const inputIds = ["portal-redirect", "github-hide-notice"];

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
    browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
        // connect will trigger main function of sap-addon.js
        browser.tabs.connect(tabs[0].id).disconnect();
    });
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
        browser.storage.local.get('options').then(res => {
            options = res.options || {};
            resolve();
        });
    });
};

let saveOptionsToStorage = function () {
    return new Promise(async function (resolve, reject) {
        browser.storage.local.set({
            options: options
        }).then(res => {
            resolve();
        });
    });
};

let initInputs = function () {
    for (let inputId of inputIds) {
        document.getElementById(inputId).checked = (!options || options[inputId] !== false);
    }
};
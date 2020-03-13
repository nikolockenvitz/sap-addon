const inputIds = ["portal-redirect", "github-hide-notice"];

let options = {};

window.onload = async function () {
    await loadOptionsFromStorage();

    for (let inputId of inputIds) {
        document.getElementById(inputId).addEventListener("change", async function (event) {
            options[inputId] = event.target.checked;
            await saveOptionsToStorage();
            browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
                // connect will trigger main function of sap-addon.js
                browser.tabs.connect(tabs[0].id).disconnect();
            });
        });
    }
    initInputs();
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
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
    "sharepoint-login",
];

let options = {};

window.onload = async function () {
    await loadOptionsFromStorage();

    for (let inputId of inputIds) {
        toggleInputOnSectionTextClick(inputId); // sectionText includes also the input itself
    }
    initInputs();
    initModals();
};

let onChangeInput = async function (inputId) {
    options[inputId] = document.getElementById(inputId).checked;
    updateDependingInputs(inputId);
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
    let sectionText = getSectionTextParent(inputEl);
    if (sectionText) {
        sectionText.addEventListener("click", function (event) {
            if (!inputEl.disabled) {
                inputEl.checked = !inputEl.checked;
                if (!event.target.classList.contains("slider")) {
                    /* click on slider creates two onclick events, so we
                    * can ignore the click on the slider and just use the
                    * click on the input
                    */
                    onChangeInput(inputId);
                }
            }
        });
    }
};

let updateDependingInputs = function (inputId) {
    /* some inputs depend on others
     * -> disable them if the input they depend on is unchecked
     * -> enable them if the input they depend on is checked
     *
     * the attribute 'data-depending-inputs' contains the ids
     * of all depending inputs (separated with a space)
     */
    let input = document.getElementById(inputId);
    if (input.hasAttribute("data-depending-inputs")) {
        for (let depId of input.getAttribute("data-depending-inputs").split(" ")) {
            let dependingInput = document.getElementById(depId);
            let sectionText = getSectionTextParent(dependingInput);
            if (input.checked) {
                dependingInput.disabled = false;
                if (sectionText) { sectionText.classList.remove("disabled"); }
            } else {
                dependingInput.disabled = true;
                if (sectionText) { sectionText.classList.add("disabled"); }
            }

        }
    }
};

let getSectionTextParent = function (element) {
    while (element) {
        if (element.classList.contains('section-text')) {
            return element;
        }
        element = element.parentElement;
    }
    return null;
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
        updateDependingInputs(inputId);
    }
};

let initModals = function () {
    let configurationModal = document.getElementById("modal-configuration");
    document.getElementById("btn-show-configuration").addEventListener("click", function () {
        console.log("show");
        configurationModal.style.display = "block";
    });
    console.log(document.getElementById("btn-hide-configuration"));
    document.getElementById("btn-hide-configuration").addEventListener("click", function () {
        configurationModal.classList.add("hide");
        setTimeout(function () {
            configurationModal.style.display = "none";
            configurationModal.classList.remove("hide");
        }, 400); // needs to be equal to what is specified in css animation
    });
};
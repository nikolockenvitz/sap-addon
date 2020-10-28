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

const inputIds = [
    "portal-redirect", "portal-focus-searchbar",
    "github-sign-in", "github-hide-notice-overlay", "github-show-names", "github-get-names-from-people",
    "fiori-lunchmenu-german",
    "sharepoint-login",
];
const buttonInputIds = [
    "github-hide-notice-show-all-again",
];
const configInputIds = [
    "config-email",
    "config-lunchmenu-language",
];

let options = {};
let config = {};

window.onload = async function () {
    await Promise.all([
        loadOptionsFromStorage(),
        loadConfigFromStorage(),
    ]);

    for (let inputId of inputIds) {
        toggleInputOnSectionTextClick(inputId); // sectionText includes also the input itself
    }
    for (const inputId of buttonInputIds) {
        addOnClickListenerForButton(inputId);
    }
    initInputs();
    initModals();
    for (let configInputId of configInputIds) {
        initConfigInput(configInputId);
    }

    addEventListenersToClosePopupOnLinkClicks();
};

let onChangeInput = async function (inputId) {
    options[inputId] = document.getElementById(inputId).checked;
    updateDependingInputs(inputId);
    await saveOptionsToStorage();
    runMainFunctionOfContentAndBackgroundScripts();
};

let runMainFunctionOfContentAndBackgroundScripts = function () {
    execAsync(browser.tabs.query, {currentWindow: true, active: true}, (tabs) => {
        for (let tab of tabs) {
            // connect will trigger main function of content scripts
            browser.tabs.connect(tab.id).disconnect();
        }
    });
    execAsync(browser.runtime.getBackgroundPage, undefined, (backgroundWindow) => {
        backgroundWindow.main();
    });
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

let addOnClickListenerForButton = function (buttonInputId) {
    const button = document.getElementById(buttonInputId);
    button.addEventListener("mousedown", function (event) {
        if (event.buttons === 1) {
            button.classList.add("button-active");
        }
    });
    button.addEventListener("click", function (event) {
        button.classList.remove("button-active");
        // send message (buttonInputId) to content script(s)
        execAsync(browser.tabs.query, {currentWindow: true, active: true}, (tabs) => {
            for (const tab of tabs) {
                browser.tabs.sendMessage(tab.id, { message: buttonInputId });
            }
        });
    });
};


let loadOptionsFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        execAsync(browser.storage.local.get.bind(browser.storage.local), "options", (res) => {
            options = res.options || {};
            resolve();
        });
    });
};

let saveOptionsToStorage = function () {
    return new Promise(async function (resolve, reject) {
        execAsync(browser.storage.local.set.bind(browser.storage.local), {options}, () => {
            resolve();
        });
    });
};

let loadConfigFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        execAsync(browser.storage.local.get.bind(browser.storage.local), "config", (res) => {
            config = res.config || {};
            resolve();
        });
    });
};

let saveConfigToStorage = function () {
    return new Promise(async function (resolve, reject) {
        execAsync(browser.storage.local.set.bind(browser.storage.local), {config}, () => {
            resolve();
        });
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
        configurationModal.style.display = "block";
    });
    document.getElementById("btn-hide-configuration").addEventListener("click", function () {
        configurationModal.classList.add("hide");
        setTimeout(function () {
            configurationModal.style.display = "none";
            configurationModal.classList.remove("hide");
        }, 400); // needs to be equal to what is specified in css animation
    });
};

let initConfigInput = function (inputId) {
    let el = document.getElementById(inputId);
    el.value = config[inputId] || "";
    el.addEventListener("change", async function () { // change will only fire after input loses focus (-> not on every keystroke)
        config[inputId] = el.value;
        await saveConfigToStorage();
        runMainFunctionOfContentAndBackgroundScripts();
    });
};

let addEventListenersToClosePopupOnLinkClicks = function () {
    let links = document.getElementsByClassName("external-link");
    for (let el of links) {
        el.addEventListener("click", function () {
            execAsync(browser.tabs.create, {url: el.title}, () => {
                window.close();
            });
        });
    }
};
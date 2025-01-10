const inputIds = [
    "github-sign-in",
    "github-hide-notice-overlay",
    "github-show-names",
    "sharepoint-login",
    "stackenterprise-login",
    "mural-login",
    "pluralsight-login",
    "jira-count-tips",
    "artifactory-login",
];
const buttonInputIds = ["github-hide-notice-show-all-again"];
const configInputIds = ["config-email", "config-user-id"];

let options = {};
let config = {};

window.onload = async function () {
    [options, config] = await Promise.all([loadFromStorage("options"), loadFromStorage("config")]);

    for (const inputId of inputIds) {
        toggleInputOnSectionTextClick(inputId); // sectionText includes also the input itself
    }
    for (const inputId of buttonInputIds) {
        addOnClickListenerForButton(inputId);
    }
    initInputs();
    initModals();
    for (const configInputId of configInputIds) {
        initConfigInput(configInputId);
    }

    addEventListenersToClosePopupOnLinkClicks();
};

async function onChangeInput(inputId) {
    options[inputId] = document.getElementById(inputId).checked;
    await saveOptionsToStorage();
    runMainFunctionOfContentAndBackgroundScripts();
}

function runMainFunctionOfContentAndBackgroundScripts() {
    execAsync(
        browser.tabs.query,
        {
            // currentWindow: true,
            // active: true,
        },
        (tabs) => {
            for (const tab of tabs) {
                // connect will trigger main function of content scripts
                browser.tabs.connect(tab.id).disconnect();
            }
        }
    );
    // send message to background scripts to re-run main function
    execAsync(
        browser.runtime.sendMessage.bind(browser.runtime),
        {
            rerunMainFunctionOfBackgroundPage: true,
            options,
            config,
        },
        () => {}
    );
}

function toggleInputOnSectionTextClick(inputIdOrEl, callback = undefined) {
    const inputEl = typeof inputIdOrEl === "string" ? document.getElementById(inputIdOrEl) : inputIdOrEl;
    const sectionText = getSectionTextParent(inputEl);
    if (sectionText) {
        sectionText.addEventListener("click", function (event) {
            if (!inputEl.disabled) {
                inputEl.checked = !inputEl.checked;
                if (!event.target.classList.contains("slider")) {
                    /* click on slider creates two onclick events, so we
                     * can ignore the click on the slider and just use the
                     * click on the input
                     */
                    if (callback) {
                        callback();
                    } else if (typeof inputIdOrEl === "string") {
                        onChangeInput(inputIdOrEl);
                    }
                }
            }
        });
    }
}

function getSectionTextParent(element) {
    while (element) {
        if (element.classList.contains("section-text")) {
            return element;
        }
        element = element.parentElement;
    }
    return null;
}

function addOnClickListenerForButton(buttonInputId) {
    const button = document.getElementById(buttonInputId);
    button.addEventListener("mousedown", function (event) {
        if (event.buttons === 1) {
            button.classList.add("button-active");
        }
    });
    button.addEventListener("click", function () {
        button.classList.remove("button-active");
        // send message (buttonInputId) to content script(s)
        execAsync(browser.tabs.query, { currentWindow: true, active: true }, (tabs) => {
            for (const tab of tabs) {
                browser.tabs.sendMessage(tab.id, { message: buttonInputId });
            }
        });
    });
}

function saveOptionsToStorage() {
    return saveToStorage("options", options);
}

function saveConfigToStorage() {
    return saveToStorage("config", config);
}

function initInputs() {
    for (const inputId of inputIds) {
        document.getElementById(inputId).checked = !options || options[inputId] !== false;
    }
}

function initModals() {
    for (const name of ["auto-login-subpage", "configuration", "permissions"]) {
        const modal = document.getElementById(`modal-${name}`);
        document.getElementById(`btn-show-${name}`).addEventListener("click", function () {
            modal.style.display = "block";
        });
        document.getElementById(`btn-hide-${name}`).addEventListener("click", function () {
            modal.classList.add("hide");
            setTimeout(function () {
                modal.style.display = "none";
                modal.classList.remove("hide");
            }, 400); // needs to be equal to what is specified in css animation
        });
    }
    initPermissionsModal();
}

function initConfigInput(inputId) {
    const el = document.getElementById(inputId);
    el.value = config[inputId] || "";
    el.addEventListener("change", async function () {
        // change will only fire after input loses focus (-> not on every keystroke)
        config[inputId] = el.value;
        await saveConfigToStorage();
        runMainFunctionOfContentAndBackgroundScripts();
    });
}

function addEventListenersToClosePopupOnLinkClicks() {
    let links = document.getElementsByClassName("external-link");
    for (const el of links) {
        el.addEventListener("click", function () {
            execAsync(browser.tabs.create, { url: el.title }, () => {
                window.close();
            });
        });
    }
}

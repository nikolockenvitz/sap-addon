function initPermissionsModal() {
    const containerPermissionsDomains = document.getElementById("permissions-domains-container");
    const templ = containerPermissionsDomains.querySelector("template");
    const contentScriptCurrentSelectionStatus = {};
    const contentScriptOriginalSelectionStatus = {};
    for (const dynamicContentScript of dynamicContentScripts) {
        const clone = templ.content.cloneNode(true);
        const domainTextNode = clone.querySelector("[data-template-id=domain]");
        domainTextNode.textContent = dynamicContentScript.name;
        const checkbox = clone.querySelector("[data-template-id=checkbox]");
        checkbox.id = `permission-domain-${dynamicContentScript.name}`;
        checkbox.checked = false;
        checkbox.disabled = true;
        const sectionText = getSectionTextParent(checkbox);
        if (sectionText) sectionText.classList.add("disabled");
        execAsync(
            browser.permissions.contains,
            {
                origins: dynamicContentScript.cs.matches,
            },
            (hasPermission) => {
                checkbox.checked = hasPermission;
                checkbox.disabled = false;
                contentScriptOriginalSelectionStatus[dynamicContentScript.name] = hasPermission;
                contentScriptCurrentSelectionStatus[dynamicContentScript.name] = hasPermission;
                if (sectionText) sectionText.classList.remove("disabled");
            }
        );
        toggleInputOnSectionTextClick(checkbox, () => {
            contentScriptCurrentSelectionStatus[dynamicContentScript.name] = checkbox.checked;
            updateButtonSaveChanges();
        });

        containerPermissionsDomains.appendChild(clone);
    }
    const btnSaveChanges = document.getElementById("btn-permissions-save-changes");
    let isBtnSaveChangesEnabled = false;
    btnSaveChanges.classList.add("disabled");
    btnSaveChanges.addEventListener("click", () => {
        if (!isBtnSaveChangesEnabled) return;
        const originsThatShouldHavePermission = [];
        const originsThatShouldNotHavePermission = [];
        for (const dynamicContentScript of dynamicContentScripts) {
            const selectionStatus = contentScriptCurrentSelectionStatus[dynamicContentScript.name];
            if (selectionStatus === true) {
                originsThatShouldHavePermission.push(...dynamicContentScript.cs.matches);
            } else if (selectionStatus === false) {
                originsThatShouldNotHavePermission.push(...dynamicContentScript.cs.matches);
            } else {
                // could in theory be undefined if permission.contains query did not resolve
            }
        }
        // TODO: remove elements that appear in originsThatShouldHavePermission from originsThatShouldNotHavePermission?!
        execAsync(
            browser.permissions.remove,
            {
                origins: originsThatShouldNotHavePermission,
            },
            () => {}
        );
        execAsync(
            browser.permissions.request,
            {
                origins: originsThatShouldHavePermission,
            },
            () => {}
        );
        // No need to update the checkboxes based on the permission.request result because
        // the addon's popup will close when the user clicks on the browser's permission request
        // However, when permissions are only removed, there will be no browser popup and the
        // addon's pup will stay opened -> original values need to be resetted and save-button disabled
        for (const name in contentScriptCurrentSelectionStatus) {
            contentScriptOriginalSelectionStatus[name] = contentScriptCurrentSelectionStatus[name];
        }
        updateButtonSaveChanges();
    });
    function setSelectionStatusForAllContentScripts(status) {
        for (const name in contentScriptCurrentSelectionStatus) {
            document.getElementById(`permission-domain-${name}`).checked = status;
            contentScriptCurrentSelectionStatus[name] = status;
        }
    }
    function updateButtonSaveChanges() {
        for (const name in contentScriptCurrentSelectionStatus) {
            if (contentScriptCurrentSelectionStatus[name] !== contentScriptOriginalSelectionStatus[name]) {
                isBtnSaveChangesEnabled = true;
                btnSaveChanges.classList.remove("disabled");
                return;
            }
        }
        isBtnSaveChangesEnabled = false;
        btnSaveChanges.classList.add("disabled");
    }
    document.getElementById("btn-permissions-select-all").addEventListener("click", () => {
        setSelectionStatusForAllContentScripts(true);
        updateButtonSaveChanges();
    });
    document.getElementById("btn-permissions-deselect-all").addEventListener("click", () => {
        setSelectionStatusForAllContentScripts(false);
        updateButtonSaveChanges();
    });
}

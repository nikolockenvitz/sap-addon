async function registerAllDynamicContentScripts() {
    const registeredContentScripts = await chrome.scripting.getRegisteredContentScripts();
    const registeredContentScriptIDs = registeredContentScripts.map((cs) => cs.id);

    dynamicContentScripts.map(async (dynamicContentScript) => {
        const csID = dynamicContentScript.name;
        const isRegistered = registeredContentScriptIDs.includes(csID);

        const hasPermission = await chrome.permissions.contains({ origins: dynamicContentScript.cs.matches });
        if (hasPermission && !isRegistered) {
            chrome.scripting.registerContentScripts([
                {
                    ...dynamicContentScript.cs,
                    id: csID,
                },
            ]);
        } else if (!hasPermission && isRegistered) {
            chrome.scripting.unregisterContentScripts({
                ids: [csID],
            });
        }
    });
}
registerAllDynamicContentScripts();

async function onPermissionChanged(_permissions) {
    registerAllDynamicContentScripts();
}
chrome.permissions.onAdded.addListener(onPermissionChanged);
chrome.permissions.onRemoved.addListener(onPermissionChanged);

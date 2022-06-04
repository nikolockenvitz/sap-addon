const registeredContentScripts = {};

async function registerAllDynamicContentScripts() {
    dynamicContentScripts.map(async (dynamicContentScript) => {
        const hasPermission = await browser.permissions.contains({ origins: dynamicContentScript.cs.matches });
        if (hasPermission) {
            registeredContentScripts[dynamicContentScript.name] = await browser.contentScripts.register({
                ...dynamicContentScript.cs,
                js: dynamicContentScript.cs.js.map((filename) => {
                    return { file: filename };
                }),
            });
        } else {
            const registration = registeredContentScripts[dynamicContentScript.name];
            if (typeof registration?.unregister === "function") {
                registration.unregister();
            }
            delete registeredContentScripts[dynamicContentScript.name];
        }
    });
}
registerAllDynamicContentScripts();

async function onPermissionChanged(_permissions) {
    registerAllDynamicContentScripts();
}
browser.permissions.onAdded.addListener(onPermissionChanged);
browser.permissions.onRemoved.addListener(onPermissionChanged);

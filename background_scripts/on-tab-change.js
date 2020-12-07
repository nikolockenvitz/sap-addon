function onTabActivated() {
    execAsync(browser.tabs.query, { currentWindow: true, active: true }, (tabs) => {
        for (const tab of tabs) {
            // connect will trigger main function of content scripts
            browser.tabs.connect(tab.id).disconnect();
        }
    });
}
browser.tabs.onActivated.addListener(onTabActivated);

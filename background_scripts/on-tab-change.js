/* initial setup for browser and promises only needs to be done in first
 * background script
 */

function onTabActivated () {
    console.log("tab activated");
    function onTabsQuery (tabs) {
        for (let tab of tabs) {
            // connect will trigger main function of content scripts
            browser.tabs.connect(tab.id).disconnect();
        }
    }
    if (usePromisesForAsync) {
        browser.tabs.query({currentWindow: true, active: true}).then(onTabsQuery);
    } else {
        browser.tabs.query({currentWindow: true, active: true}, onTabsQuery);
    }
}
browser.tabs.onActivated.addListener(onTabActivated);
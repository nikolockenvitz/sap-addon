function loadFromStorage(name, defaultValue = {}) {
    return new Promise(function (resolve) {
        execAsync(browser.storage.local.get.bind(browser.storage.local), name, (res) => {
            resolve(res[name] || defaultValue);
        });
    });
}

function saveToStorage(name, value) {
    return new Promise(function (resolve) {
        execAsync(browser.storage.local.set.bind(browser.storage.local), { [name]: value }, () => {
            resolve();
        });
    });
}

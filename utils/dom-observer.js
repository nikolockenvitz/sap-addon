class DOMObserver {
    constructor(target) {
        this.observerCallbacks = {};
        const that = this;
        this.observer = new MutationObserver(function (mutation, _observer) {
            for (const id in that.observerCallbacks) {
                that.observerCallbacks[id](mutation, _observer);
            }
        });
        this.observer.observe(target || document, {
            childList: true,
            characterData: true,
            subtree: true,
        });
    }

    registerCallbackFunction(id, callback) {
        if (!this.observerCallbacks[id]) {
            this.observerCallbacks[id] = callback;
        }
    }

    unregisterCallbackFunction(id) {
        delete this.observerCallbacks[id];
    }
}
const domObserver = new DOMObserver();

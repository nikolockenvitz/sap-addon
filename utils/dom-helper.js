function executeFunctionAfterPageLoaded(func, args = []) {
    window.addEventListener("load", (e) => {
        func(...args);
    });
    if (document.readyState === "complete") {
        func(...args);
    }
}

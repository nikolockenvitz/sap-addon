let usePromisesForAsync = false;
let isChromium = false;
if (typeof browser !== "undefined") {
    usePromisesForAsync = true;
} else {
    window.browser = chrome;
    isChromium = true;
}
function execAsync(asyncFunction, args, callback) {
    if (!Array.isArray(args)) args = [args];
    if (usePromisesForAsync) {
        asyncFunction(...args).then(callback);
    } else {
        asyncFunction(...args, callback);
    }
}

const url = new URL(window.location.href);

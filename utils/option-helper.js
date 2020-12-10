function isEnabled(optionName) {
    return !options || options[optionName] !== false; // enabled per default
}

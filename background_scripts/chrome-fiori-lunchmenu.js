const fioriLunchmenuConfig = {
    ruleId: 1337,
    optionName: "fiori-lunchmenu-german",
    configNameLanguage: "config-lunchmenu-language",
};

function fioriLunchmenuUpdateDeclarativeNetRequest(args) {
    const { config, options } = args;
    const changeLunchmenuLanguageEnabled = isEnabled(options, fioriLunchmenuConfig.optionName);
    const language = config[fioriLunchmenuConfig.configNameLanguage];
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [fioriLunchmenuConfig.ruleId],
        ...(changeLunchmenuLanguageEnabled && language
            ? {
                  // only add rule if enabled in options + language set in config
                  addRules: [
                      {
                          id: fioriLunchmenuConfig.ruleId,
                          condition: {
                              regexFilter:
                                  "https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/webapp/api/client/tiles/*|https://fiorilaunchpad.sap.com/sap/fiori/lunchmenu/api/client/lunch*",
                          },
                          action: {
                              type: "modifyHeaders",
                              requestHeaders: [
                                  {
                                      header: "Accept-Language",
                                      operation: "set",
                                      value: language,
                                  },
                              ],
                          },
                      },
                  ],
              }
            : {}),
    });
}

function isEnabled(options, optionName) {
    return !options || options[optionName] !== false; // enabled per default
}

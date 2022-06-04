const dynamicContentScripts = [
    {
        name: "github.concur.com",
        cs: {
            js: [
                "/utils/browser-setup.js",
                "/utils/storage.js",
                "/utils/dom-observer.js",
                "/utils/option-helper.js",
                "/utils/dom-helper.js",
                "/content_scripts/github/config.js",
                "/content_scripts/github/sign-in.js",
                "/content_scripts/github/hide-notice-box.js",
                "/content_scripts/github/username.js",
                "/content_scripts/github/main.js",
            ],
            matches: ["*://github.concur.com/*"],
            runAt: "document_start",
        },
    },
    {
        name: "nikolockenvitz.de",
        cs: {
            js: ["/content_scripts/hello-world.js"],
            matches: ["*://nikolockenvitz.de/*"],
            runAt: "document_start",
        },
    },
    {
        name: "example.org",
        cs: {
            js: ["/content_scripts/hello-world.js"],
            matches: ["*://example.org/*"],
            runAt: "document_start",
        },
    },
];

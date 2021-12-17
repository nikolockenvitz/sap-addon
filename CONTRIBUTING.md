# Contributing to SAP Addon

To get started with browser extension development, I can really recommend [MDN web docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions).

Unfortunately there was no time yet to provide a comprehensive documentation of the addons architecture and the source code but file and function names should roughly tell you what each part is about.
Feel free to ask if you need help or something is unclear.

## Local testing

For testing you can download or clone this repository and install it as a temporary addon.
You may need to disable the current installation of the addon.

### Firefox
Open `about:debugging` and switch to `This Firefox` ([about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)).
Click button `Load Temporary Add-on...` in top right corner.
Select `manifest.json` of this repository.

This makes the add-on available until you close/restart Firefox.
Don't forget to click on the `Reload` button for the temporary extension when you want to test your changes.

### Chrome
Open `chrome://extensions/` and enable `Developer mode` in the top right corner.
Click button `Load unpacked` in top left corner.
Select this folder.
(You need to remove/rename the top-level file `_config.yml` when uploading to Chrome since Chrome complains about the underscore at the beginning of the filename. You may rename it to `config.yml` and run `git update-index --skip-worktree _config.yml` to let git ignore the change locally.)

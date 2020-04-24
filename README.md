# sap-addon

<a href="https://nikolockenvitz.github.io/sap-addon/xpi/sap_addon-1.13-fx.xpi">
<img src="https://img.shields.io/badge/firefox-v1.13-FF7139?logo=mozilla-firefox" alt="Install for Firefox" /></a>
<a href="https://www.mozilla.org/en-US/firefox/new/">
<img src="https://img.shields.io/badge/chrome----4285F4?logo=google-chrome" alt="Not yet available in Chrome Web Store" /></a>

Install by clicking on the badge above.
There is no version published to addons.mozilla.org (AMO) because reviewers of AMO complained that it can only be used by a small number of people and thus it's not relevant for AMO.

Updates are handled automatically.

I am currently examining deployment options for Chrome.
If you want to use it in Chrome anyway, see below for [other installation options](#chrome).

## current features
![Screenshot of Popup](docs/screenshot-1.13-popup.png)
![Screenshot of Configuration in Popup](docs/screenshot-1.13-popup-config.png)

* `portal.wdf.sap.corp`
  * redirect from login page (`/home`) to main page (`/irj/portal`)
  * focus the search bar automatically when loading page
* `github.wdf.sap.corp` / `github.tools.sap`
  * sign in automatically
  * hide yellow notice box
  * show name instead of user id (inspired by https://github.com/cgrail/github-chrome-fullname)
  * get name from `people.wdf.sap.corp` (use GitHub only as a fallback)
    * names are cached in local storage
    * also some metadata is stored to be able to clean the cache based on usage later
* `fiorilaunchpad.sap.com` <!-- it's the Fiori Lunchpad ;) name created by Erik Jansky -->
  * override language of lunchmenu (by default German) so that you will see it e.g. in German even if language in the Fiori Launchpad settings is set to English
    * language can be configured
    * currently supports `de` and `en`
    * other values will work too but you
* `sap-my.sharepoint.com` / `login.microsoftonline.com`
  * log in automatically
  * e-mail can be set in configuration

All features are enabled by default but can be disabled in the settings popup.

## feedback, contribute, ...
Feel free to send feedback, share any ideas of what you think should be improved or can be added.

Please also report if you encounter bugs or things that are not working as you expect.

If you want to help, you can just contact me or open a pull request.
For testing you can download or clone this repository and install it as a temporary addon.

### Firefox
Open `about:debugging` and switch to `This Firefox` ([about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)).
Click button `Load Temporary Add-on...` in top right corner.
Select `manifest.json` of this repository.

This makes the add-on available until you close/restart Firefox.

### Chrome
Open `chrome://extensions/` and enable `Developer mode` in the top right corner.
Click button `Load unpacked` in top left corner.
Select this folder.

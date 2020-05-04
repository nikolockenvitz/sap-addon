# sap-addon

<!-- SHIELD IO BADGES INSTALL START -->
<a href="https://nikolockenvitz.github.io/sap-addon/xpi/sap_addon-1.13.3-fx.xpi">
<img src="https://img.shields.io/badge/firefox-v1.13.3-FF7139?logo=mozilla-firefox" alt="Install for Firefox" /></a>
<!-- SHIELD IO BADGES INSTALL END -->
<a href="https://chrome.google.com/webstore/detail/sap-addon/ccjpkhcdklddbfpcboffbeihonalpjkc">
<img src="https://img.shields.io/badge/chrome-v1.13.3-4285F4?logo=google-chrome" alt="Install for Chrome" /></a>

Install by clicking on the badge above.
Updates are handled automatically.

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
    * other values will work too but you will see a warning (just contact me if you have other valid values and I will add them as well)
* `sap-my.sharepoint.com` / `login.microsoftonline.com`
  * log in automatically
  * sometimes e-mail address is needed to log in, you can specify it in configuration

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

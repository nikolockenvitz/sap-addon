# sap-addon

## install
<a href="https://nikolockenvitz.github.io/sap-addon/xpi/sap_addon-1.12-fx.xpi">
<img src="https://img.shields.io/badge/firefox-v1.12-FF7139?logo=mozilla-firefox" alt="Install for Firefox" /></a>
<a href="https://www.mozilla.org/en-US/firefox/new/">
<img src="https://img.shields.io/badge/chrome----4285F4?logo=google-chrome" alt="Not yet available in Chrome Web Store" /></a>

Install by clicking on the badge above.
Additionally you can find the `.xpi`s of this addon and the previous versions in the [corresponding folder of this repository](https://github.com/nikolockenvitz/sap-addon/tree/master/xpi) to download and install in Firefox (just drag into browser or use tools in `about:addons` to install from file).
There is no version published to [addons.mozilla.org (AMO)](https://addons.mozilla.org) because reviewers of AMO complained that it can only be used by a small number of people and thus it's not relevant for AMO.

Updates are handled automatically.

There is no version published to Chrome Web Store because there is a registration fee of $5.
Also, since I don't use Chrome, I am unable to offer good support.
If you want to use it in Chrome, see below for other installation options.

If you want to help to support other browsers than Firefox, just open a pull request or contact me.

## current features
* `portal.wdf.sap.corp`
  * redirect from login page (`/home`) to main page (`/irj/portal`)
  * focus the search bar automatically when loading page
* `github.wdf.sap.corp` / `github.tools.sap`
  * sign in automatically
  * hide yellow notice box
  * show name instead of user id (inspired by https://github.com/cgrail/github-chrome-fullname)
  * get name from `people.wdf.sap.corp` (use GitHub only as a fallback)
  * names are cached in local storage
* `fiorilaunchpad.sap.com` <!-- it's the Fiori Lunchpad ;) name created by Erik Jansky -->
  * show lunchmenu in German (even if default language is English)

All features are enabled by default but can be disabled in the settings popup.

![Screenshot of popup](docs/screenshot-popup-1.10.png)

## install [dev]
Download or clone this repository.

### Firefox
Open `about:debugging` and switch to `This Firefox` ([about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)).
Click button `Load Temporary Add-on...` in top right corner.
Select `manifest.json` of this repository.

This makes the add-on available until you close/restart Firefox.

### Chrome
Open `chrome://extensions/` and enable `Developer mode` in the top right corner.
Click button `Load unpacked` in top left corner.
Select this folder.

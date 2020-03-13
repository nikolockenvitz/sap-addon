# sap-addon

## current features
* `portal.wdf.sap.corp`
  * redirect from login page (`/home`) to main page (`/irj/portal`)
* `github.wdf.sap.corp`
  * hide yellow notice box

## install
Find the xpi of this addon in the release section of this repository to install in Firefox (just drag into browser or use tools in `about:addons` to install from file).

## install [dev]
Download or clone this repository.

### Firefox
Open `about:debugging` and switch to `This Firefox` ([about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)).
Click button `Load Temporary Add-on...` in top right corner.
Select `manifest.json` of this repository.

This makes the add-on available until you close/restart Firefox.

### Chrome
**Currently not working in Chrome because Chrome uses callbacks instead of promises for asynchronous APIs**

Open `chrome://extensions/` and enable `Developer mode` in the top right corner.
Click button `Load unpacked` in top left corner.
Select this folder.
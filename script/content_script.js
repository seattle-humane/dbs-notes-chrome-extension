// From https://stackoverflow.com/a/9517879
var s = document.createElement('script');
// injected_script.js must be listed in web_accessible_resources in manifest.json
s.src = chrome.extension.getURL('script/injected_script.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
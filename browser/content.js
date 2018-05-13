// From https://stackoverflow.com/a/9517879
// Injected scripts must be listed in web_accessible_resources in manifest.json
function inject_script(path_to_script) {
    var s = document.createElement('script');
    
    s.type = 'module';
    s.src = chrome.extension.getURL(path_to_script);
    s.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

// This must go first so other scripts can reference it
// (some sort of webpack+require.js solution would be better, but I wanted to keep the dev machinery minimal)
//inject_script('injected_scripts/utils.js');

inject_script('injected_scripts/animal_search.js');
inject_script('injected_scripts/exercise_notes.js');
inject_script('injected_scripts/session_timeout.js');
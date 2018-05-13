// This script extends PetPoint's default session timeout to prevent volunteers from having to log in as often

function preventSessionTimeoutOnce() {
    console.debug('preventSessionTimeoutOnce faking a key press');
    var fakeKeypressEventThatSatisfiesPageReqMgrJsHandler = {target: { focus: function() { } } }
    document.onkeypress(fakeKeypressEventThatSatisfiesPageReqMgrJsHandler);
}

setInterval(preventSessionTimeoutOnce, 30000);
console.debug('SHSDBS: Session Timeout setup complete');
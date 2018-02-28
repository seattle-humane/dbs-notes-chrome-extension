function preventSessionTimeout() {
    setTimeout(preventSessionTimeout, 60*1000);

    if(!KeepSessionAlive) {
        console.error('Expected petpoint script /sms3/scripts/PageReqMgr.js to define KeepSessionAlive(), but it didn\'t happen (yet?)');
    } else {
        console.debug('Forcibly keeping session alive...')
        KeepSessionAlive();
    }
}

preventSessionTimeout();
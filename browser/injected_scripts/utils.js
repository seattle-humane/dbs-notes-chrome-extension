// content.js loads this file first, so other injected_scripts can reference it via "shsdbs_utils"

// returns whether a change() was induced
export function changeSelectElementToValueWithText(selectElement, text) {
    var desiredOption = selectElement.children().filter(function() { return $(this).text() == text } );
    if (desiredOption.length === 0) {
        console.error(`could not find option with text '${text}' under '${selectElement}'`);
        return false;
    }

    var desiredOptionValue = desiredOption.attr('value');

    if (selectElement.val() != desiredOptionValue) {
        selectElement.val(desiredOptionValue).change();
        return true;
    }
    return false;
}

export function registerUpdatePanelHandler(panelSelector, handler) {
    let currentPanels = $(panelSelector);
    if (currentPanels.length === 0) {
        console.debug(`registerUpdatePanelHandler('${panelSelector}'): Skipping, no panels matched`);
        return;
    }

    var observer = new MutationObserver(function(mutationsList) {
        console.debug('Observed mutation ' + mutationsList);
        for(var mutation of mutationsList) {
            if (mutation.type == 'childList' && $(mutation.target).is(panelSelector)) {
                console.debug('Observed addition of panel matching ' + panelSelector)
                setTimeout(handler, 0);
            }
        }
    });

    currentPanels.parent().each(function() {
        console.debug('Registering observer at ' + this);
        observer.observe(this, {childList: true, subtree: true})
    });

    handler();
}

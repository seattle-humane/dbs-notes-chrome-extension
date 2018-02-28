function preventSessionTimeout() {
    setTimeout(preventSessionTimeout, 60*1000);

    if(!KeepSessionAlive) {
        console.error('Expected petpoint script /sms3/scripts/PageReqMgr.js to define KeepSessionAlive(), but it didn\'t happen (yet?)');
    } else {
        console.debug('Forcibly keeping session alive...')
        KeepSessionAlive();
    }
}

function setAnimalSearchCriteriaDefaults() {
    var searchCriteriaSelectElement = $('table.search select[id$=_ctrlAnimalSearch_ddlCriteria]');

    if (searchCriteriaSelectElement.length === 0) {
        console.debug('No search UI on page, skipping setAnimalSearchCriteriaDefaults');
        return;
    }

    var nameOption = searchCriteriaSelectElement.children().filter(function() { return $(this).text() == "Name" } );
    var nameOptionValue = nameOption.attr('value');

    console.debug('Setting criteria to Name, detected as value ' + nameOptionValue);
    searchCriteriaSelectElement.val(nameOptionValue).change();

    var dynamicSetAttempts = 0;
    var dynamicSetRetryDelayMs = 100;
    var dynamicSetMaxAttempts = 50;
    var setDefaultsForDynamicallyAddedElements = function() {
        dynamicSetAttempts++;
        console.debug('entering setDefaultsForDynamicallyAddedElements attempt ' + dynamicSetAttempts);

        // It's important not to cache the table.search element from the non-dynamic part because
        // the whole table.search element gets replaced during the search criteria UI update
        var activeOnlyRadioInput = $('table.search input[id$=_ctrlAnimalSearch_CB_OnlyActive_1]');
        var animalNameInputBox = $('table.search input[id$=_ctrlAnimalSearch_txtFirstCriteria]');

        if (activeOnlyRadioInput.length === 0 || animalNameInputBox.length === 0) {
            if (dynamicSetAttempts > dynamicSetMaxAttempts) {
                console.error('Giving up on finding dynamically added search elements');
            } else {
                console.debug('Didn\'t find dynamically added search elements, scheduling another try...');
                // This is important for the case where our original change to the element happened before PetPoint's
                // onchange handler was dynamically registered
                searchCriteriaSelectElement.change();
                setTimeout(setDefaultsForDynamicallyAddedElements, dynamicSetRetryDelayMs);
            }
            return;
        }

        console.debug('Selecting Active Only radio input');
        activeOnlyRadioInput.prop("checked", true).change();

        console.debug('Assigning focus to the Animal Name input box');
        animalNameInputBox.focus();
    };
    setTimeout(setDefaultsForDynamicallyAddedElements, 1000);
}

preventSessionTimeout();

// The 1s delay is required for the New Care Activity page, but not the Edit Animal page
// Would be nice to find a more deterministic way to deal with New Care Activity
setTimeout(setAnimalSearchCriteriaDefaults, 1000);
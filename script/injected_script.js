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

    if (searchCriteriaSelectElement.val() != nameOptionValue) {
        searchCriteriaSelectElement.val(nameOptionValue).change();
    } else {
        var activeOnlyRadioInput = $('table.search input[id$=_ctrlAnimalSearch_CB_OnlyActive_1]');
        var animalNameInputBox = $('table.search input[id$=_ctrlAnimalSearch_txtFirstCriteria]');
        if (activeOnlyRadioInput.length === 0 || animalNameInputBox.length === 0) {
            console.warn('unexpected search UI state'); return;
        }
        activeOnlyRadioInput.prop("checked", true);
        animalNameInputBox.focus();
    }
}

function hideUnnecessaryGlobalPetPointUi() {
    $('div.master_menuholder').hide();
    $('a#aLogo').attr('href', 'CareActivityTab.aspx?CreateActivity=1')
}

function hideUnnecessaryCareActivityUi() {
    for(selector of [
        // Care Activity page header
        'table.main_header_table',
        // Selected animal list
        '#cphSearchArea_ctrlCareActivity_ctrlCareActivityAnimalList_pnlAnimalList',
        // standalone 'Animal Search' tab under main tabs
        '#cphSearchArea_ctrlCareActivity_ctrlAnimal_Button0',
        // Unnecessary checkbox in search UI
        '#cphSearchArea_ctrlCareActivity_ctrlAnimal_tblCreateOwnership',
        // Unnecessary buttons in search UI
        '#cphSearchArea_ctrlCareActivity_ctrlAnimal_ctrlAnimalSearch_btnSearchAdvanced',
        '#cphSearchArea_ctrlCareActivity_ctrlAnimal_ctrlAnimalSearch_btnClearSearch',
        '#cphSearchArea_ctrlCareActivity_ctrlAnimal_btnCreateNewAnimal',
        // Unnecessary info in Add Note UI
        '#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_pnlActivityDetails table.created_by',
        // Unnecessary buttons in Add Note UI
        '#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_btnSpellCheck',
        '#cphSearchArea_ctrlCareActivity_btnSave',
        '#cphSearchArea_ctrlCareActivity_btnClear' // doesn't actually clear fields
    ]) {
        $(selector).hide();
    }
}

// Returns the empty string if no animal is selected
function getSelectedAnimalName() {
    const nameColumnIndex = 4;

    var selectedAnimalsTable = $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityAnimalList_dgAnimals');
    if (selectedAnimalsTable.length === 0) {
        // Expected case for no selected animals
        return '';
    }
    
    var headerCells = selectedAnimalsTable.find('tr.grid_header td');
    var nameColumnHeaderText = $(headerCells[nameColumnIndex]).text();
    if (nameColumnHeaderText != 'Name') {
        console.error(`getSelectedAnimalName: expected column ${nameColumnIndex} to be Name but was ${nameColumnHeaderText}`)
        return '';
    }
    var dataCells = selectedAnimalsTable.find('tr.grid_row td');
    if (dataCells.length === 0) {
        console.warn('getSelectedAnimalName: no data cells');
        return '';
    }
    return $(dataCells[nameColumnIndex]).text();
}

function adjustCareActivityTabs() {
    var selectedAnimalName = getSelectedAnimalName();
    if (selectedAnimalName == '') {
        $('#cphSearchArea_ctrlCareActivity_Button0').hide(); // Search
        $('#cphSearchArea_ctrlCareActivity_Button1').hide(); // Person
        $('#cphSearchArea_ctrlCareActivity_Button2').val('Pick an animal'); // Animal (which is really a search UI in this case)
        $('#cphSearchArea_ctrlCareActivity_Button3').hide(); // Details
    } else {
        $('#cphSearchArea_ctrlCareActivity_Button0').val('Pick an animal') // Search
        $('#cphSearchArea_ctrlCareActivity_Button0').click(function() {
            // The default behavior is to search activities by ID, which is useless
            // Replace it with a link back to the animal search UI
            window.location.href = 'CareActivityTab.aspx?CreateActivity=1'
        });
        
        $('#cphSearchArea_ctrlCareActivity_Button1').hide(); // Person
        $('#cphSearchArea_ctrlCareActivity_Button2').val(`Read ${selectedAnimalName}'s notes`); // Animal
        $('#cphSearchArea_ctrlCareActivity_Button3').val(`Add new note for ${selectedAnimalName}`); // Details
    }
}

function onCareActivityPanelLoad() {
    hideUnnecessaryCareActivityUi();
    adjustCareActivityTabs();
    setAnimalSearchCriteriaDefaults();
}

function registerUpdatePanelHandler(panelSelector, handler) {
    var observer = new MutationObserver(function(mutationsList) {
        console.debug('Observed mutation ' + mutationsList);
        for(var mutation of mutationsList) {
            if (mutation.type == 'childList' && $(mutation.target).is(panelSelector)) {
                console.debug('Observed addition of panel matching ' + panelSelector)
                setTimeout(handler, 0);
            }
        }
    });

    $(panelSelector).parent().each(function() {
        console.debug('Registering observer at ' + this);
        observer.observe(this, {childList: true, subtree: true})
    });
}

preventSessionTimeout();
hideUnnecessaryGlobalPetPointUi();
registerUpdatePanelHandler('div#cphSearchArea_ctrlCareActivity_pnlCareActivityTabs', onCareActivityPanelLoad);

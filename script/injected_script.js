function preventSessionTimeoutOnce() {
    var fakeKeypressEventThatSatisfiesPageReqMgrJsHandler = {target: { focus: function() { } } }
    document.onkeypress(fakeKeypressEventThatSatisfiesPageReqMgrJsHandler);
}
function preventSessionTimeout() {
    console.debug('preventSessionTimeout');
    setInterval(preventSessionTimeoutOnce, 30000);
}

function registerSiteWidePetPointUiUpdates() {
    console.debug('registerSiteWidePetPointUiUpdates');
    $('div.master_menuholder').hide();
    $('a#aLogo').attr('href', 'CareActivityTab.aspx?CreateActivity=1')
}

g_AlreadySetDefaults = false;
function setAnimalSearchCriteriaDefaults() {
    if (g_AlreadySetDefaults) { return; }
    
    console.debug('setAnimalSearchCriteriaDefaults');
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
        g_AlreadySetDefaults = true;
    }
}

function hideUnnecessaryCareActivityUi() {
    console.debug('hideUnnecessaryCareActivityUi');
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
    return getSelectedAnimalField(4, 'Name');
}
function getSelectedAnimalId() { // Includes 'A' prefix
    return getSelectedAnimalField(1, 'Animal #');
}
function getSelectedAnimalIdNumber() { // Strips 'A' prefix
    return getSelectedAnimalId().substring(1);
}
function isAnimalSelected() {
    return getSelectedAnimalId() != '';
}
function openDbsNotesPopup() {
    // Ideally we'd replace this with an iframe, pending a support request to have the custom document renderable via https
    var id = getSelectedAnimalIdNumber();
    window.open(`../embeddedreports/CustomDocument.aspx?document=CustomAnimalDocument,DBS Notes,${id}`);
}

function getSelectedAnimalField(columnIndex, expectedColumnName) {
    // PetPoint ID dependencies
    var selectedAnimalsTable = $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityAnimalList_dgAnimals');
    var headerCells = selectedAnimalsTable.find('tr.grid_header td');
    var dataCells = selectedAnimalsTable.find('tr.grid_row td');
    
    // Selection logic
    if (selectedAnimalsTable.length === 0) {
        // Expected case for no selected animals
        return '';
    }
    
    var nameColumnHeaderText = $(headerCells[columnIndex]).text();
    if (nameColumnHeaderText != expectedColumnName) {
        console.error(`getSelectedAnimalField: expected column ${columnIndex} to be ${expectedColumnName} but was ${columnIndex}`)
        return '';
    }

    if (dataCells.length === 0) {
        console.warn('getSelectedAnimalField: no data cells');
        return '';
    }

    return $(dataCells[columnIndex]).text();
}

function adjustCareActivityTabs() {
    var selectedAnimalName = getSelectedAnimalName();
    if (!isAnimalSelected()) {
        console.debug('adjustCareActivityTabs (no animal selected)');
        $('#cphSearchArea_ctrlCareActivity_Button0').hide(); // Search (but by activity, not what we want)
        $('#cphSearchArea_ctrlCareActivity_Button1').hide(); // Person
        $('#cphSearchArea_ctrlCareActivity_Button2').val('Pick an animal').click(showPageLoadingScreen); // Animal (the by-animal search UI we actually want)
        $('#cphSearchArea_ctrlCareActivity_Button3').hide(); // Details
    } else {
        console.debug('adjustCareActivityTabs (animal selected)');
        $('#cphSearchArea_ctrlCareActivity_Button0').val('Pick an animal') // Search
        $('#cphSearchArea_ctrlCareActivity_Button0')[0].type = 'button'; // Suppress default tab behavior by disconnecting it from form submit
        $('#cphSearchArea_ctrlCareActivity_Button0').click(function() {
            // The default behavior is to search activities by ID, which is useless
            // Replace it with a link back to the animal search UI
            window.location.href = 'CareActivityTab.aspx?CreateActivity=1'
        });
        
        $('#cphSearchArea_ctrlCareActivity_Button1').hide(); // Person
        $('#cphSearchArea_ctrlCareActivity_Button2').val(`Read ${selectedAnimalName}'s notes`) // Animal
        $('#cphSearchArea_ctrlCareActivity_Button2')[0].type = 'button'; // Suppress default tab behavior by disconnecting it from form submit
        $('#cphSearchArea_ctrlCareActivity_Button2').click(function() {
            openDbsNotesPopup();
        })
        $('#cphSearchArea_ctrlCareActivity_Button3').val(`Add new note for ${selectedAnimalName}`).click(showPageLoadingScreen); // Details
    }
}

function replaceAnimalTabContentWithDbsNotes() {
    var animalTabContentContainer = $('#cphSearchArea_ctrlCareActivity_tabNavigation2');
    if (!isAnimalSelected() || animalTabContentContainer.length === 0) {
        return;
    }

    animalTabContentContainer.html(`
    <iframe src="../embeddedreports/CustomDocument.aspx?document=CustomAnimalDocument,DBS%20Notes,37737071" />
    `);
}

function onCareActivityPanelUpdate() {
    console.debug('onCareActivityPanelUpdate');
    hideUnnecessaryCareActivityUi();
    adjustCareActivityTabs();
    //replaceAnimalTabContentWithDbsNotes();
    setAnimalSearchCriteriaDefaults();
    hidePageLoadingScreen();
}

function registerCareActivityPetPointUiUpdates() {
    console.debug('registerCareActivityPetPointUiUpdates');
    registerUpdatePanelHandler('div#cphSearchArea_ctrlCareActivity_pnlCareActivityTabs', onCareActivityPanelUpdate);
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

    handler();
}

function showPageLoadingScreen() {
    $('#extension-injected-page-loading-screen').fadeIn('fast');
}
function hidePageLoadingScreen() {
    $('#extension-injected-page-loading-screen').fadeOut();
}
function setupPageLoadingScreen() {
    var loadingScreenDiv = $('<div id="extension-injected-page-loading-screen">Loading...</div>').css({
        'position': 'fixed',
        'width': '100%',
        'height': '100%',
        'background-color': '#fff',
        'z-index': 999,
        'top': 0,
        'left': 0,
        'text-align': 'center',
        'padding': '200px',
        'font-size': '3em',
        'opacity': .95,
        //'display': 'none',
    });

    $('body').append(loadingScreenDiv);
}

function addOnBodyCreatedListener(handler) {
    if ((typeof $ !== 'undefined') && $('body').length !== 0) { return handler(); }

    var observer = new MutationObserver(function(mutationsList) {
        console.debug('Observed mutation ' + mutationsList);
        for(var mutation of mutationsList) {
            if (mutation.type == 'childList' && $(mutation.target).is('body')) {
                console.debug('Observed addition of body');
                handler();
                observer.disconnect();
            }
        }
    });
    
    observer.observe(document, {childList: true, subtree: true});
}

addOnBodyCreatedListener(function() {
    setupPageLoadingScreen();
});
document.addEventListener('DOMContentLoaded', function() {
    preventSessionTimeout();
    registerSiteWidePetPointUiUpdates();
    registerCareActivityPetPointUiUpdates();
})
window.DOMContentLoaded



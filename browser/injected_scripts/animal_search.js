// This script sets up all Animal Search panels to default to searching by Name among Active animals, rather than
// by ID among all animals.

import * as utils from './utils.js';

// We use the global to avoid continuously resetting back to defaults if a user manually changes the search
// criteria after we've set it once during page setup.
let g_setAnimalSearchCriteriaDefaults_done = false;
function setAnimalSearchCriteriaDefaultsOnce() {
    if (g_setAnimalSearchCriteriaDefaults_done) { return; }

    console.debug('setAnimalSearchCriteriaDefaults');
    var searchCriteriaSelectElement = $('table.search select[id$=_ctrlAnimalSearch_ddlCriteria]');

    if (searchCriteriaSelectElement.length === 0) {
        console.debug('No search UI on page, skipping setAnimalSearchCriteriaDefaults');
        return;
    }

    var changedCriteria = utils.changeSelectElementToValueWithText(searchCriteriaSelectElement, 'Name');
    if (changedCriteria) {
        console.debug('setAnimalSearchCriteriaDefaults: Modified criteria, waiting for panel update to continue')
        return;
    }

    var activeOnlyRadioInput = $('table.search input[id$=_ctrlAnimalSearch_CB_OnlyActive_1]');
    var animalNameInputBox = $('table.search input[id$=_ctrlAnimalSearch_txtFirstCriteria]');
    if (activeOnlyRadioInput.length === 0 || animalNameInputBox.length === 0) {
        console.warn('unexpected search UI state'); return;
    }
    activeOnlyRadioInput.prop("checked", true);
    animalNameInputBox.focus();

    console.debug('setAnimalSearchCriteriaDefaults: Finished, disabling future panel updates from resetting defaults')
    g_setAnimalSearchCriteriaDefaults_done = true;
}

function registerAnimalSearchPanelUpdateHandler() {
    let selectorMatchingAllAnimalSearchPanels = [
        'div#cphSearchArea_ctrlCareActivity_pnlCareActivityTabs',
        'div#cphSearchArea_ctrlAnimal_ctrlAnimalSearch_pnlAnimalSearch'
    ].join(', ');

    utils.registerUpdatePanelHandler(
        selectorMatchingAllAnimalSearchPanels,
        setAnimalSearchCriteriaDefaultsOnce);
}

registerAnimalSearchPanelUpdateHandler();
console.debug('SHSDBS: Animal Search setup complete');
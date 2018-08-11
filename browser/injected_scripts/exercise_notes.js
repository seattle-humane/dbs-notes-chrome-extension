// This script modifies the PetPoint "Care Activity" page to act as Seattle Humane's "Exercise Notes" page.
//
// The specific changed functionality includes:
//   * Adds a top-level Exercise Notes link to the main PetPoint nav UI
//   * Removes most of the Care Activity UI (everything Seattle Humane volunteers don't need to see to do their jobs)
//   * Adds one UI tab with a direct link to see the current exercise notes for a dog
//   * Adds one UI tab with a form for volunteers to fill in notes from exercising a dog
//     - This form is parsed client-side, and normalized to a single giant text blob that gets passed to PetPoint's
//       original Care Activity "Notes" field.

import * as utils from './utils.js';

function addNotesButtonToNavMenu() {
    let navMenuList = $('#ctl00_MenuPP ul.rmRootGroup');

    navMenuList.prepend(`
        <li class="shsdbs-main-nav-item">
            <a href="CareActivityTab.aspx?CreateActivity=1">
                <span>Exercise Notes</span>
            </a>
        </li>
    `);
}

function setCareActivityDetailsDefaults() {
    console.debug('setCareActivityDetailsDefaults');
    let categorySelectElement = $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_ddlPMCategory');

    if (categorySelectElement.length === 0) {
        console.debug('setCareActivityDetailsDefaults: Not on care activity details page, skipping');
        return;
    }

    let changedCategory = utils.changeSelectElementToValueWithText(categorySelectElement, 'DBS');
    if (changedCategory) {
        console.debug('setCareActivityDetailsDefaults: Modified category, waiting for panel update to continue');
        return; // need to wait for a new panel update to repopulate type before we can change it
    }
    
    let typeSelectElement = $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_ddlPMActivityType');
    let changedType = utils.changeSelectElementToValueWithText(typeSelectElement, 'Other');
    if (changedType) {
        console.debug('setCareActivityDetailsDefaults: Modified type');
    }
}

function hideUnnecessaryCareActivityUi() {
    console.debug('hideUnnecessaryCareActivityUi');
    for(let selector of [
        // Unnecessary 'Person: Anonymous' subheader (we never select a Person)
        '#cphSearchArea_ctrlCareActivity_ctrlCareActivityHeader_lblPersonName',
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
        '#cphSearchArea_ctrlCareActivity_btnClear', // doesn't actually clear fields!
        // 'Not authorized to edit Animal records' message (only shows up on some accounts!)
        '#cphSearchArea_ctrlCareActivity_plhNotAuthorizedMessage'
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

function getSelectedAnimalField(columnIndex, expectedColumnName) {
    // PetPoint ID dependencies
    let selectedAnimalsTable = $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityAnimalList_dgAnimals');
    let headerCells = selectedAnimalsTable.find('tr.grid_header td');
    let dataCells = selectedAnimalsTable.find('tr.grid_row td');
    
    // Selection logic
    if (selectedAnimalsTable.length === 0) {
        // Expected case for no selected animals
        return '';
    }
    
    let nameColumnHeaderText = $(headerCells[columnIndex]).text();
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

function adjustCareActivityHeader() {
    let headerText = isAnimalSelected() ?
        `Exercise Notes: ${getSelectedAnimalName()} (${getSelectedAnimalId()})` :
        'Exercise Notes';

    $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityHeader_lblHeaderText')
        .text(headerText);
}

function adjustCareActivityTabs() {
    $('#cphSearchArea_ctrlCareActivity_Button1').hide(); // Person
    $('#cphSearchArea_ctrlCareActivity_Button4').hide(); // Summary

    $('#cphSearchArea_ctrlCareActivity_Button0').attr('formnovalidate', 'formnovalidate');
    $('#cphSearchArea_ctrlCareActivity_Button2').attr('formnovalidate', 'formnovalidate');
    $('#cphSearchArea_ctrlCareActivity_Button3').attr('formnovalidate', 'formnovalidate');

    let selectedAnimalName = getSelectedAnimalName();
    if (!isAnimalSelected()) {
        console.debug('adjustCareActivityTabs (no animal selected)');
        $('#cphSearchArea_ctrlCareActivity_Button0').hide(); // Search (but by activity, not what we want)
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
        
        $('#cphSearchArea_ctrlCareActivity_Button2').val(`Read ${selectedAnimalName}'s notes`).click(showPageLoadingScreen); // Animal

        $('#cphSearchArea_ctrlCareActivity_Button3').val(`Add new note for ${selectedAnimalName}`).click(showPageLoadingScreen); // Details
    }
}

function replaceAnimalTabContentWithDbsNotes() {
    let animalTabContentContainer = $('#cphSearchArea_ctrlCareActivity_tabNavigation2');
    if (!isAnimalSelected() || animalTabContentContainer.length === 0) {
        return;
    }

    // This is what we want to do, but we're blocked because CustomDocument.aspx
    // downgrades from https to http in a redirect, which we have no means of
    // intercepting or forcibly upgrading to prevent the resulting "mixed content"
    // errors. PetPoint support case #00429913.

    /*
    animalTabContentContainer.html(`
        <iframe src="../embeddedreports/CustomDocument.aspx?document=CustomAnimalDocument,DBS%20Notes,37737071" />
    `);
    */

    animalTabContentContainer.children().hide();
    animalTabContentContainer.append(createViewNotesButton('DBS Notes'));
    animalTabContentContainer.append($('<br />'));
    animalTabContentContainer.append(createViewNotesButton('RDR Notes'));
}

// notesDocument should map to the reportName of a Document Builder report under Animal -> Publish
function createViewNotesButton(notesDocument) {
    return $(`<input type="button" class="button_green" id="shsdbs-notes-button" value="Open ${notesDocument} in new tab" />`)
        .bind('click', function() {
            // Ideally we'd replace this with an iframe, pending a support request to have the custom document renderable via https
            let id = getSelectedAnimalIdNumber();
            window.open(`../embeddedreports/CustomDocument.aspx?document=CustomAnimalDocument,${notesDocument},${id}`);
        });
}

function validateAtLeastOneChecked(checkboxInputName, validationElement) {
    // From https://stackoverflow.com/a/45363898
    let cbx_group = $(`input:checkbox[name='${checkboxInputName}']`);
    if (cbx_group.is(":checked")) {
        // checkboxes become unrequired as long as one is checked
        cbx_group.prop("required", false).each(function() {
            this.setCustomValidity("");
        });
    } else {
        // require checkboxes and set custom validation error message
        cbx_group.prop("required", true).each(function() {
            this.setCustomValidity("Please select at least one checkbox.");
        });
    }
}

function getSelectedCheckboxValues(checkboxName) {
    let output = [];
    $(`input[name="${checkboxName}"]:checked`).each(function() {
        output.push(this.value);
    });
    return output;
}

function setSelectedCheckboxValues(root, checkboxName, selectedValues) {
    root.find(`input[name="${checkboxName}"]`).each(function() {
        $(this).prop('checked', (selectedValues.indexOf(this.value) != -1));
    });
}

// Returns an object with a property for each <select> in the container that
// maps from its <label> text to the selected <option>'s text
//
// Omits cases where the selected option's text or value is ''
//
// Requires each <select id="foo"> have a corresponding <label for="foo">
function getSelectBoxValues(selectContainerElement) {
    let output = {};
    selectContainerElement.find('select').each(function() {
        let selectElement = $(this);
        let selectId = selectElement.attr('id')
        
        let labelElement = selectContainerElement.find(`label[for="${selectId}"]`);
        let labelText = labelElement.text().trim().replace(/:$/, '');

        let selectedOptionElement = selectElement.find('option:selected');
        let selectedOptionValue = selectedOptionElement.val() || selectedOptionElement.text();
        if (selectedOptionValue == '') {
            return;
        }

        output[labelText] = selectedOptionValue;
    });
    return output;
}

function setSelectBoxValues(selectContainerElement, selectedValues) {
    selectContainerElement.find('select').each(function() {
        let selectElement = $(this);
        let selectId = selectElement.attr('id')
        
        let labelElement = selectContainerElement.find(`label[for="${selectId}"]`);
        let labelText = labelElement.text().trim().replace(/:$/, '');

        let selectedOptionValue = selectedValues[labelText];
        if (selectedOptionValue) {
            let selectedOptionElement = selectElement.find(`option:contains(${selectedOptionValue})`)
            selectedOptionElement.prop('selected', true);
        }
    });
}

function getTrainingSummary(trainingSelectBoxValues) {
    return Object.entries(trainingSelectBoxValues).map(function(labelValuePair) {
        return `${labelValuePair[0]} (${labelValuePair[1]})`;
    }).join(', ') || 'n/a';
}

function getObservationsSummary(observationSelectBoxValues) {
    return Object.entries(observationSelectBoxValues).map(function(labelValuePair) {
        return `${labelValuePair[0]}: ${labelValuePair[1]}`;
    }).join(', ');
}

function formatCareActivityNote(noteUiState) {
    // This exact value must remain stable for several report builder reports to work
    let formattedFlagForStaff = noteUiState.flagForStaff ? '!!! FLAGGED FOR STAFF REVIEW !!!' : '';

    let activitySummary = noteUiState.activities.join(', ');
    let trainingSummary = getTrainingSummary(noteUiState.training);
    let observationsSummary = getObservationsSummary(noteUiState.observations);
    
    return `
${formattedFlagForStaff}
${activitySummary} (${noteUiState.volunteerName}, ${noteUiState.volunteerRole})
Training: ${trainingSummary}
${observationsSummary}

${noteUiState.comments}
        `.trim();
}

function getNoteUiState() {
    return {
        volunteerName: $('#shsdbs-noteui-input-yourname').val(),
        volunteerRole: $('#shsdbs-noteui-input-dbslevel').val(),
        activities: getSelectedCheckboxValues('shsdbs-noteui-input-activity'),
        training: getSelectBoxValues($('#shsdbs-noteui-training')),
        observations: getSelectBoxValues($('#shsdbs-noteui-observations')),
        comments: $('#shsdbs-noteui-input-comments').val(),
        flagForStaff: $('#shsdbs-noteui-input-flagforstaff').is(':checked'),
    };
}

function setNoteUiState(noteUi, state) {
    noteUi.find('#shsdbs-noteui-input-yourname').val(state.volunteerName);
    noteUi.find('#shsdbs-noteui-input-dbslevel').val(state.volunteerRole);
    setSelectedCheckboxValues(noteUi, 'shsdbs-noteui-input-activity', state.activities);
    setSelectBoxValues(noteUi.find('#shsdbs-noteui-training'), state.training);
    setSelectBoxValues(noteUi.find('#shsdbs-noteui-observations'), state.observations);
    noteUi.find('#shsdbs-noteui-input-comments').val(state.comments);
    noteUi.find('#shsdbs-noteui-input-flagforstaff').prop('checked', state.flagForStaff);
}

let g_lastNoteUiState = null;
function onNoteUiInputChange() {
    validateAtLeastOneChecked('shsdbs-noteui-input-activity');

    g_lastNoteUiState = getNoteUiState();
    let formattedNotes = formatCareActivityNote(g_lastNoteUiState);
    $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_txtActivityNotes').val(formattedNotes);
}

function setUpAddNoteUi() {
    let newAddNoteUi = $(`
    <div id="shsdbs-noteui-container">
    <div class="shsdbs-noteui-horizontal-section">
        <fieldset>
        <label for="shsdbs-noteui-input-yourname">Your Name:</label>
        <input type="text" id="shsdbs-noteui-input-yourname" class="form-control" autocomplete="name" required />
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-dbslevel">Your Position:</label>
        <select id="shsdbs-noteui-input-dbslevel" class="form-control" required>
            <option value="">-- Select --</option>
            <option>DBS 2</option>
            <option>DBS 3</option>
            <option>DBS 4</option>
            <option>RDR</option>
            <option>DCE</option>
            <option>BPA</option>
            <option>Other Volunteer</option>
            <option>Staff</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-animalname">Animal's Name:</label>
        <input type="text" id="shsdbs-noteui-input-animalname" class="form-control" disabled />
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-datetime">Date/Time:</label>
        <div id="replace_with_original_date_time" /></fieldset>
        </fieldset>
    </div>
    <h1>Activity</h1>
    <div class="shsdbs-noteui-section">
        <fieldset id="shsdbs-noteui-fieldset-activity">
        <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-walk" value="Walk" />
        <label for="shsdbs-noteui-input-activity-walk">Walk</label>

        <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-training" value="Training" />
        <label for="shsdbs-noteui-input-activity-training">Training</label>

        <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-play" value="Play" />
        <label for="shsdbs-noteui-input-activity-play">Play</label>

        <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-socialization" value="Socialization" />
        <label for="shsdbs-noteui-input-activity-socialization">Socialization</label>

        <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-massage" value="Massage" />
        <label for="shsdbs-noteui-input-activity-massage">Massage</label>

        <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-nosework" value="Nosework" />
        <label for="shsdbs-noteui-input-activity-nosework">Nosework</label>

        <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-run" value="Run" />
        <label for="shsdbs-noteui-input-activity-run">Run</label>

        <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-fieldtrip" value="Field Trip" />
        <label for="shsdbs-noteui-input-activity-fieldtrip">Field Trip</label>

        <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-other" value="Other" />
        <label for="shsdbs-noteui-input-activity-other">Other</label>
        </fieldset>
    </div>
    <h1>Training</h1>
    <div id="shsdbs-noteui-training" class="shsdbs-noteui-horizontal-section">
        <fieldset>
        <label for="shsdbs-noteui-input-training-touch">Touch:</label>
        <select id="shsdbs-noteui-input-training-touch" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-sit">Sit:</label>
        <select id="shsdbs-noteui-input-training-sit" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-come">Come:</label>
        <select id="shsdbs-noteui-input-training-come" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-watchme">Watch Me:</label>
        <select id="shsdbs-noteui-input-training-watchme" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-wait">Wait:</label>
        <select id="shsdbs-noteui-input-training-wait" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-down">Down:</label>
        <select id="shsdbs-noteui-input-training-down" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-leaveit">Leave It:</label>
        <select id="shsdbs-noteui-input-training-leaveit" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-dropit">Drop It:</label>
        <select id="shsdbs-noteui-input-training-dropit" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-takeit">Take It:</label>
        <select id="shsdbs-noteui-input-training-takeit" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-stay">Stay:</label>
        <select id="shsdbs-noteui-input-training-stay" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-training-shake">Shake/Hi-5:</label>
        <select id="shsdbs-noteui-input-training-shake" class="form-control">
            <option></option>
            <option>Word</option>
            <option>Hand</option>
            <option>Lure</option>
        </select>
        </fieldset>
    </div>
    <h1>Observations</h1>
    <div id="shsdbs-noteui-observations" class="shsdbs-noteui-horizontal-section">
        <fieldset>
        <label for="shsdbs-noteui-input-looseleash">On Leash:</label>
        <select id="shsdbs-noteui-input-looseleash" class="form-control">
            <option></option>
            <option>Loose leash</option>
            <option>Some pulling</option>
            <option>Lots of pulling</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-treatdrive">Treat Drive:</label>
        <select id="shsdbs-noteui-input-treatdrive" class="form-control">
            <option></option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-playdrive">Play Drive:</label>
        <select id="shsdbs-noteui-input-playdrive" class="form-control">
            <option></option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-gentlemouth">Takes treats:</label>
        <select id="shsdbs-noteui-input-gentlemouth" class="form-control">
            <option></option>
            <option>Gently</option>
            <option>Roughly</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-peoplefocus">People Focus:</label>
        <select id="shsdbs-noteui-input-peoplefocus" class="form-control">
            <option></option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-otherdogs">Other Dogs:</label>
        <select id="shsdbs-noteui-input-otherdogs" class="form-control">
            <option></option>
            <option>Calm/Ignores</option>
            <option>Interested</option>
            <option>Reactive</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-stresslevel">Stress Level:</label>
        <select id="shsdbs-noteui-input-stresslevel" class="form-control" required>
            <option></option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
        </select>
        </fieldset>
        <fieldset>
        <label for="shsdbs-noteui-input-shyfearful">Shyness/Fearfulness:</label>
        <select id="shsdbs-noteui-input-shyfearful" class="form-control" required>
            <option></option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
        </select>
        </fieldset>
    </div>
    <div class="shsdbs-noteui-section">
        <h1>Comments</h1>
        <textarea rows="4" cols="50" style="width:98%;" class="form-control" id="shsdbs-noteui-input-comments" />

        <fieldset id="shsdbs-noteui-flagforstaff">
            <input type="checkbox" name="shsdbs-noteui-input-flagforstaff" id="shsdbs-noteui-input-flagforstaff" value="Flag For Staff Review" />
            <label for="shsdbs-noteui-input-flagforstaff">🚩 Flag For Staff Review <em>(explain why in comments!)</em> 🚩</label>
        </fieldset>
    </div>
    <div class="shsdbs-noteui-section shsdbs-debug-only">
        <h1>Full note</h1>
        <textarea id="replace_with_original_note_areatext" />
    </div>
    <!-- separator -->
    <div id="replace_with_original_submit_button" />
    </div>
    `);
    let originalAddNoteUi = $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_pnlActivityDetails');

    newAddNoteUi.find('#shsdbs-noteui-input-animalname').val(`${getSelectedAnimalName()} (${getSelectedAnimalId()})`);
    newAddNoteUi.find('select').bind('change', onNoteUiInputChange);
    newAddNoteUi.find('input, textarea').bind('input', onNoteUiInputChange);
    newAddNoteUi.find('input[type=checkbox]').bind('click', onNoteUiInputChange);

    newAddNoteUi
        .find('#replace_with_original_date_time')
        .replaceWith($('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_txtStatusDate'));
    newAddNoteUi
        .find('#replace_with_original_note_areatext')
        .replaceWith($('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_txtActivityNotes')
        .prop('disabled', true)
        .prop('rows', 12));
    newAddNoteUi
        .find('#replace_with_original_submit_button')
        .replaceWith($('#cphSearchArea_ctrlCareActivity_btnAdd'));

    if (g_lastNoteUiState !== null) {
        setNoteUiState(newAddNoteUi, g_lastNoteUiState);
    }
    
    originalAddNoteUi.children().hide();
    originalAddNoteUi.append(newAddNoteUi);

    onNoteUiInputChange();
    $('#shsdbs-noteui-input-yourname').focus();
}

function replaceSummaryTabContentWithConfirmationText() {
    $('#cphSearchArea_ctrlCareActivity_tabNavigation4').children().hide();
    $('#cphSearchArea_ctrlCareActivity_tabNavigation4').append(
        $(`<h1>Added a note for ${getSelectedAnimalName()}!</h1>`))
}

function onCareActivityPanelUpdate() {
    console.debug('onCareActivityPanelUpdate');
    hideUnnecessaryCareActivityUi();
    adjustCareActivityHeader();
    adjustCareActivityTabs();
    replaceAnimalTabContentWithDbsNotes();
    setCareActivityDetailsDefaults();
    setUpAddNoteUi();
    replaceSummaryTabContentWithConfirmationText();
    hidePageLoadingScreen();
}

function registerCareActivityPetPointUiUpdates() {
    console.debug('registerCareActivityPetPointUiUpdates');
    utils.registerUpdatePanelHandler('div#cphSearchArea_ctrlCareActivity_pnlCareActivityTabs', onCareActivityPanelUpdate);
}

// We set this as an extra on-click handler to any PetPoint buttons that will
// result in re-population of DOM elements that we need to inject changes into
// during onCareActivityPanelUpdate(). The corresponding hide call happens at
// the end of that update handler.
function showPageLoadingScreen() {
    $('#extension-injected-page-loading-screen').fadeIn('fast');
}

function hidePageLoadingScreen() {
    $('#extension-injected-page-loading-screen').fadeOut();
}
function setupPageLoadingScreen() {
    let loadingScreenDiv = $('<div id="extension-injected-page-loading-screen">Loading...</div>');
    $('body').append(loadingScreenDiv);
}

addNotesButtonToNavMenu();
setupPageLoadingScreen();
registerCareActivityPetPointUiUpdates();
console.debug('SHSDBS: Exercise Notes setup complete');
$('body').show();

(function() {
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
    
    // returns whether a change() was induced
    function changeSelectElementToValueWithText(selectElement, text) {
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

    g_setAnimalSearchCriteriaDefaults_done = false;
    function setAnimalSearchCriteriaDefaultsOnce() {
        if (g_setAnimalSearchCriteriaDefaults_done) { return; }

        console.debug('setAnimalSearchCriteriaDefaults');
        var searchCriteriaSelectElement = $('table.search select[id$=_ctrlAnimalSearch_ddlCriteria]');

        if (searchCriteriaSelectElement.length === 0) {
            console.debug('No search UI on page, skipping setAnimalSearchCriteriaDefaults');
            return;
        }

        var changedCriteria = changeSelectElementToValueWithText(searchCriteriaSelectElement, 'Name');
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

    function setCareActivityDetailsDefaults() {
        console.debug('setCareActivityDetailsDefaults');
        var categorySelectElement = $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_ddlPMCategory');

        if (categorySelectElement.length === 0) {
            console.debug('setCareActivityDetailsDefaults: Not on care activity details page, skipping');
            return;
        }

        var changedCategory = changeSelectElementToValueWithText(categorySelectElement, 'DBS');
        if (changedCategory) {
            console.debug('setCareActivityDetailsDefaults: Modified category, waiting for panel update to continue');
            return; // need to wait for a new panel update to repopulate type before we can change it
        }
        
        var typeSelectElement = $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_ddlPMActivityType');
        var changedType = changeSelectElementToValueWithText(typeSelectElement, 'Other');
        if (changedType) {
            console.debug('setCareActivityDetailsDefaults: Modified type');
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
            '#cphSearchArea_ctrlCareActivity_btnClear', // doesn't actually clear fields!
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
        $('#cphSearchArea_ctrlCareActivity_Button1').hide(); // Person
        $('#cphSearchArea_ctrlCareActivity_Button4').hide(); // Summary

        var selectedAnimalName = getSelectedAnimalName();
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
        var animalTabContentContainer = $('#cphSearchArea_ctrlCareActivity_tabNavigation2');
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

        var openDbsNotesButton = $('<input type="button" value="Open DBS Notes in new tab" />').bind('click', openDbsNotesPopup);

        animalTabContentContainer.children().hide();
        animalTabContentContainer.append(openDbsNotesButton);
    }

    function validateAtLeastOneChecked(checkboxInputName, validationElement) {
        // From https://stackoverflow.com/a/45363898
        $cbx_group = $(`input:checkbox[name='${checkboxInputName}']`);
        if ($cbx_group.is(":checked")) {
            // checkboxes become unrequired as long as one is checked
            $cbx_group.prop("required", false).each(function() {
                this.setCustomValidity("");
            });
        } else {
            // require checkboxes and set custom validation error message
            $cbx_group.prop("required", true).each(function() {
                this.setCustomValidity("Please select at least one checkbox.");
            });
        }
    }

    function getSelectedCheckboxValues(checkboxName) {
        var output = [];
        $(`input[name="${checkboxName}"]:checked`).each(function() {
            output.push(this.value);
        });
        return output;
    }

    // Returns an object with a property for each <select> in the container that
    // maps from its <label> text to the selected <option>'s text
    //
    // Omits cases where the selected option's text or value is ''
    //
    // Requires each <select id="foo"> have a corresponding <label for="foo">
    function getSelectBoxValues(selectContainerElement) {
        var output = {};
        selectContainerElement.find('select').each(function() {
            var selectElement = $(this);
            var selectId = selectElement.attr('id')
            
            var labelElement = selectContainerElement.find(`label[for="${selectId}"]`);
            var labelText = labelElement.text().trim().replace(/:$/, '');

            var selectedOptionElement = selectElement.find('option:selected');
            var selectedOptionValue = selectedOptionElement.val() || selectedOptionElement.text();
            if (selectedOptionValue == '') {
                return;
            }

            output[labelText] = selectedOptionValue;
        });
        return output;
    }

    function getTrainingSummary() {
        var selectedValues = getSelectBoxValues($('#shsdbs-noteui-training'));
        return Object.entries(selectedValues).map(function(labelValuePair) {
            return `${labelValuePair[0]} (${labelValuePair[1]})`;
        }).join(', ') || 'n/a';
    }

    function getObservationsSummary() {
        var selectedValues = getSelectBoxValues($('#shsdbs-noteui-observations'));
        return Object.entries(selectedValues).map(function(labelValuePair) {
            return `${labelValuePair[0]}: ${labelValuePair[1]}`;
        }).join(', ');
    }

    function recalculateRawNotesFromNoteUi() {
        var volunteerName = $('#shsdbs-noteui-input-yourname').val();
        var dbsLevel = $('#shsdbs-noteui-input-dbslevel').val();
        var activitySummary = getSelectedCheckboxValues('shsdbs-noteui-input-activity').join(', ');
        var trainingSummary = getTrainingSummary();
        var observationsSummary = getObservationsSummary();
        var comments = $('#shsdbs-noteui-input-comments').val();
        
        return `
${activitySummary} (${volunteerName}, ${dbsLevel})
Training: ${trainingSummary}
${observationsSummary}

${comments}
            `.trim();
    }

    function onNoteUiInputChange() {
        validateAtLeastOneChecked('shsdbs-noteui-input-activity');

        var notes = recalculateRawNotesFromNoteUi();
        console.debug('recalculated notes');
        $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_txtActivityNotes').val(notes);
    }

    function setUpAddNoteUi() {
        var newAddNoteUi = $(`
        <div id="shsdbs-noteui-container">
        <div class="shsdbs-noteui-horizontal-section">
            <fieldset>
            <label for="shsdbs-noteui-input-yourname">Your Name:</label>
            <input type="text" id="shsdbs-noteui-input-yourname" class="form-control" autocomplete="name" required />
            </fieldset>
            <fieldset>
            <label for="shsdbs-noteui-input-dbslevel">Your DBS Level:</label>
            <select id="shsdbs-noteui-input-dbslevel" class="form-control" required>
                <option value="">-- Select --</option>
                <option>DBS 2</option>
                <option>DBS 3</option>
                <option>DBS 4</option>
                <option>BPA</option>
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

            <input type="checkbox" name="shsdbs-noteui-input-activity" id="shsdbs-noteui-input-activity-other" value="Other" />
            <label for="shsdbs-noteui-input-activity-other">Other</label>
            </fieldset>
        </div>
        <h1>Training</h1>
        <div id="shsdbs-noteui-training" class="shsdbs-noteui-horizontal-section">
            <fieldset>
            <label for="shsdbs-noteui-input-training-sit">Sit:</label>
            <select id="shsdbs-noteui-input-training-sit" class="form-control">
                <option></option>
                <option>Got it!</option>
                <option>Word</option>
                <option>Hand</option>
                <option>Lure</option>
            </select>
            </fieldset>
            <fieldset>
            <label for="shsdbs-noteui-input-training-down">Down:</label>
            <select id="shsdbs-noteui-input-training-down" class="form-control">
                <option></option>
                <option>Got it!</option>
                <option>Word</option>
                <option>Hand</option>
                <option>Lure</option>
            </select>
            </fieldset>
            <fieldset>
            <label for="shsdbs-noteui-input-training-touch">Touch:</label>
            <select id="shsdbs-noteui-input-training-touch" class="form-control">
                <option></option>
                <option>Got it!</option>
                <option>Word</option>
                <option>Hand</option>
                <option>Lure</option>
            </select>
            </fieldset>
            <fieldset>
            <label for="shsdbs-noteui-input-training-watchme">Watch Me:</label>
            <select id="shsdbs-noteui-input-training-watchme" class="form-control">
                <option></option>
                <option>Got it!</option>
                <option>Word</option>
                <option>Hand</option>
                <option>Lure</option>
            </select>
            </fieldset>
            <fieldset>
            <label for="shsdbs-noteui-input-training-come">Come:</label>
            <select id="shsdbs-noteui-input-training-come" class="form-control">
                <option></option>
                <option>Got it!</option>
                <option>Word</option>
                <option>Hand</option>
                <option>Lure</option>
            </select>
            </fieldset>
            <fieldset>
            <label for="shsdbs-noteui-input-training-stay">Stay:</label>
            <select id="shsdbs-noteui-input-training-stay" class="form-control">
                <option></option>
                <option>Got it!</option>
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
            <label for="shsdbs-noteui-input-peoplefocus">People Focus:</label>
            <select id="shsdbs-noteui-input-peoplefocus" class="form-control" required>
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
                <option>Somewhat Reactive</option>
                <option>Very Reactive</option>
            </select>
            </fieldset>
            <fieldset>
            <label for="shsdbs-noteui-input-stresslevel">Stress level:</label>
            <select id="shsdbs-noteui-input-stresslevel" class="form-control" required>
                <option></option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
            </select>
            </fieldset>
            <fieldset>
            <label for="shsdbs-noteui-input-shyfearful">Shyness/fearfulness:</label>
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
        </div>
        <div class="shsdbs-noteui-section shsdbs-debug-only">
            <h1>Full note</h1>
            <textarea id="replace_with_original_note_areatext" />
        </div>
        <!-- separator -->
        <div id="replace_with_original_submit_button" />
        </div>
        `);
        var originalAddNoteUi = $('#cphSearchArea_ctrlCareActivity_ctrlCareActivityDetails_pnlActivityDetails');

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
        adjustCareActivityTabs();
        replaceAnimalTabContentWithDbsNotes();
        setAnimalSearchCriteriaDefaultsOnce();
        setCareActivityDetailsDefaults();
        setUpAddNoteUi();
        replaceSummaryTabContentWithConfirmationText();
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
        var loadingScreenDiv = $('<div id="extension-injected-page-loading-screen">Loading...</div>');
        $('body').append(loadingScreenDiv);
    }

    preventSessionTimeout();
    setupPageLoadingScreen();
    registerSiteWidePetPointUiUpdates();
    registerCareActivityPetPointUiUpdates();
    console.debug('Seattle Humane extension setup complete');
    $('body').show();
})();



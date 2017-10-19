/*
University of Freiburg WS 2017/2018
Chair for Bioinformatics
Supervisor: Martin Raden
Author: Alexander Mattheis
*/

"use strict";

(function () {  // namespace
    // public methods (declaration)
    namespace("postProcessing.inputProcessor",
        InputProcessor, activateInputUpdates, inputUpdatesActivated, linkElements, updateGUI, postEdit);

    // instances
    var inputProcessorInstance;

    /**
     * Does all the post-processing
     * like removing/updating wrong inputs
     * and it defines how different
     * input types behave.
     */
    function InputProcessor() {
        inputProcessorInstance = this;

        // variables
        this.inputUpdatesStarted = false;
        this.avoidFocusOutUpdate = false;

        // public class methods
        this.activateInputUpdates = activateInputUpdates;
        this.inputUpdatesActivated = inputUpdatesActivated;
        this.linkElements = linkElements;
        this.updateGUI = updateGUI;
        this.postEdit = postEdit;
    }

    /**
     * Activates algorithm input updates after changes on the input.
     */
    function activateInputUpdates() {
        inputProcessorInstance.inputUpdatesStarted = true;
    }

    /**
     * Checks if input updates are activated or not.
     * @return {boolean} - "true" if updates are activated.
     */
    function inputUpdatesActivated() {
        return inputProcessorInstance.inputUpdatesStarted;
    }

    /**
     * Linking static elements with a function.
     * @param visualViewmodel {Object} - Model which is used for example to highlight cells.
     */
    function linkElements(visualViewmodel) {
        fixBrowserBugs();
        changeDefaultKeyBehaviour();

        // retrieve parameters
        var algorithmInput = $("#algorithm_input");
        var functionParameters = algorithmInput.find(".fx_parameter");

        var mainOutput = $(".main_output");  // output containing the calculation tables
        var calculationTable = mainOutput.find(".calculation");
        var calculationHorizontalTable = mainOutput.find(".calculation_horizontal");
        var calculationVerticalTable = mainOutput.find(".calculation_vertical");

        var calculationTable1 = mainOutput.find(".calculation_1");  // AEP iterations
        var calculationTable2 = mainOutput.find(".calculation_2");
        var calculationTable3 = mainOutput.find(".calculation_3");
        var calculationTable4 = mainOutput.find(".calculation_4");
        var calculationTable5 = mainOutput.find(".calculation_5");

        var iterationTablesArray = [calculationTable1, calculationTable2, calculationTable3, calculationTable4, calculationTable5];

        var selectableEntryClass = ".selectable_entry";

        // linking (alphabetically sorted)
        linkBasicInputsBehaviour(algorithmInput, functionParameters);
        linkDownloadLinks(visualViewmodel, calculationVerticalTable, calculationTable, calculationHorizontalTable);
        linkOverlay(visualViewmodel, calculationVerticalTable, calculationTable, calculationHorizontalTable, iterationTablesArray, mainOutput);
        linkSelectables(visualViewmodel, calculationVerticalTable, calculationTable, calculationHorizontalTable, iterationTablesArray,
            mainOutput, selectableEntryClass);
    }

    /**
     * Bug fixes for specific browsers or versions of browsers.
     */
    function fixBrowserBugs() {
        /*
         BUG-FIX for Firefox:
         Inputs of type "number" doesn't get the focus
         in the Firefox browser if one
         of the up- or down-buttons of the number-inputs
         is clicked.

         Detected: Firefox 55.0b3 (32-Bit)
         */
        $(function () {
            $("input[type='number']").on("click", function () {
                $(this).focus();
            });
        });
    }

    /**
     * Redefines what for example should happen
     * when a specific key is pressed or on a specific action like pasting.
     */
    function changeDefaultKeyBehaviour() {
        var input = $("input");
        /*
         If "Enter" is pressed the UI should't update immediately.
         The time after which the UI is updated is specified
         with the global default "REUPDATE_TIMEOUT_MS".
         */
        input.keypress(function (e) {
            // Hint: Better would be a tabulator behaviour,
            // but the implementation of that is too complex.
            if (e.which === KEY_CODES.ENTER)
                e.preventDefault();
        });
    }

    /**
     * Linking inputs to have some special behaviour (removing non allowed bases).
     * @param algorithmInput - The input div in which the behaviour is changed.
     * @param functionParameters - The parameters which should have the given behaviour.
     */
    function linkBasicInputsBehaviour(algorithmInput, functionParameters) {
        var functionArguments = {"functionParameters": functionParameters};
        algorithmInput.find(".optimization_type").on("change", functionArguments, negateOptimizationParameters);

        functionParameters.on("focusout keypress", removeCriticalNumbers);
        algorithmInput.find(".sequence").on("keyup", removeNonAllowedBases);
    }

    /**
     * Negates the function parameters of an algorithm.
     * Hint: The input has to be of class "optimization_type".
     * @param e - Stores data relevant to the event called that function.
     */
    function negateOptimizationParameters(e) {
        var functionParameters = e.data.functionParameters;

        for (var i = 0; i < functionParameters.length; i++)
            functionParameters[i].value = -functionParameters[i].value;
    }

    /**
     * Removes values from an input-field
     * which can lead to problems with traceback or visualization.
     * It is especially used for the function parameters of an algorithm.
     * Hint: The input has to be of class "fx_parameter".
     * @param e - Stores data relevant to the event called that function.
     */
    function removeCriticalNumbers(e) {
        if (CHARACTER.NUMBERS.test(this.value))
            this.value = Math.round(this.value);

        if (e.which === KEY_CODES.ENTER || e.type === "focusout") {
            if (this.id === "length") {
                this.value = this.value >= INPUT.LENGTH_MIN ? this.value : INPUT.LENGTH_MIN;
                this.value = this.value <= INPUT.LENGTH_MAX ? this.value : INPUT.LENGTH_MAX;
            }
            else
            {
                this.value = this.value >= INPUT.MIN ? this.value : INPUT.MIN;
                this.value = this.value <= INPUT.MAX ? this.value : INPUT.MAX;
            }
        }
    }

    /**
     * Removes non-english characters from an input-field.
     * Hint: The input has to be of class "sequence".
     */
    function removeNonAllowedBases() {
        if (!CHARACTER.BASES.test(this.value))
            this.value = this.value.replace(CHARACTER.NON_BASES, SYMBOLS.EMPTY);
    }

    /**
     * Linking table download links of tables with a download function.
     * @param visualViewmodel {Object} - Model which is used for example to highlight cells.
     * @param calculationTable {Element} - The default or main table.
     * @param calculationVerticalTable {Element} - The table storing the vertical gap costs.
     * @param calculationHorizontalTable {Element} - The table storing the horizontal gap costs.
     */
    function linkDownloadLinks(visualViewmodel, calculationVerticalTable, calculationTable, calculationHorizontalTable) {
        var tableDownload = $(".table_download");
        var tableVerticalDownload = $(".table_vertical_download");
        var tableHorizontalDownload = $(".table_horizontal_download");

        var functionArguments = {
            "calculationTable": calculationTable,
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "number": MATRICES.VERTICAL_NUMBER
        };
        tableVerticalDownload.on("click", functionArguments, visualViewmodel.downloadTable);

        functionArguments = {
            "calculationTable": calculationTable,
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "number": MATRICES.DEFAULT_NUMBER
        };
        tableDownload.on("click", functionArguments, visualViewmodel.downloadTable);

        functionArguments = {
            "calculationTable": calculationTable,
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "number": MATRICES.HORIZONTAL_NUMBER
        };
        tableHorizontalDownload.on("click", functionArguments, visualViewmodel.downloadTable);

        linkIterationDownloadLinks(visualViewmodel);
    }

    /**
     * Linking table download links of tables from several iterations with a download function.
     * @param visualViewmodel {Object} - Model which is used for example to highlight cells.
     */
    function linkIterationDownloadLinks(visualViewmodel) {
        for (var i = 0; i < MAX_NUMBER_ITERATIONS; i++) {
            var currentTableNumber = (i + 1);
            linkIterationDownloadLink(
                $(".table_download_"+ currentTableNumber),
                $(".calculation_" + currentTableNumber),
                -currentTableNumber,  // iteration numbers are negative in "defaults.js"
                visualViewmodel);
        }
    }

    /**
     * Linking table download link of a table generated during an iterative algorithm with a download function.
     * @param download {Element} - The link-element <a>...</a> which is to be linked.
     * @param table {Element} - The table you want download.
     * @param number {number} - The table id.
     * @param visualViewmodel {Object} - Model which is used for example to highlight cells.
     */
    function linkIterationDownloadLink(download, table, number, visualViewmodel) {
        download.on("click", {"calculationTable": table, "number": number}, visualViewmodel.downloadTable);
    }

    /**
     * Allows to redraw an overlay on a scroll or resize event.
     * @param visualViewmodel {Object} - Model which is used for example to highlight cells.
     * @param calculationTable {Element} - The default or main table.
     * @param calculationVerticalTable {Element} - The table storing the vertical gap costs.
     * @param calculationHorizontalTable {Element} - The table storing the horizontal gap costs.
     * @param iterationTablesArray {Array} - An array of tables.
     * @param mainOutput {Element} - The div containing only the calculation tables.
     */
    function linkOverlay(visualViewmodel, calculationVerticalTable, calculationTable, calculationHorizontalTable, iterationTablesArray, mainOutput) {
        var browserWindow = $(window);

        var functionArguments = {
            "iterationTablesArray": iterationTablesArray,
            "calculationTable": calculationTable,
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "mainOutput": mainOutput
        };
        browserWindow.on("resize", functionArguments, visualViewmodel.redrawOverlay);
        mainOutput.on("scroll", functionArguments, visualViewmodel.redrawOverlay);
    }

    /**
     * Linking all elements which can be selected (results, cells, ...).
     * @param visualViewmodel {Object} - Model which is used for example to highlight cells.
     * @param calculationVerticalTable {Element} - The table storing the vertical gap costs.
     * @param calculationTable {Element} - The default or main table.
     * @param calculationHorizontalTable {Element} - The table storing the horizontal gap costs.
     * @param iterationTablesArray {Array} - An array of tables.
     * @param mainOutput {Element} - The div containing only the calculation tables.
     * @param selectableEntryClass {Object} - The class name of a selectable entry.
     */
    function linkSelectables(visualViewmodel, calculationVerticalTable, calculationTable, calculationHorizontalTable, iterationTablesArray,
                             mainOutput, selectableEntryClass) {
        linkIterationTables(visualViewmodel, calculationVerticalTable, calculationHorizontalTable, iterationTablesArray,
            mainOutput, selectableEntryClass);

        var results = $(".results");

        var functionArguments = {
            "calculationTable": calculationTable,
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "resultsTable": results,
            "mainOutput": mainOutput,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };
        results.on("click", selectableEntryClass, functionArguments, selectTableEntry);

        functionArguments = {
            "calculationTable": calculationTable,
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "mainOutput": mainOutput,
            "number": MATRICES.VERTICAL_NUMBER,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };
        calculationVerticalTable.on("click", selectableEntryClass, functionArguments, selectCell);

        functionArguments = {
            "calculationTable": calculationTable,
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "mainOutput": mainOutput,
            "number": MATRICES.DEFAULT_NUMBER,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };
        calculationTable.on("click", selectableEntryClass, functionArguments, selectCell);

        functionArguments = {
            "calculationTable": calculationTable,
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "mainOutput": mainOutput,
            "number": MATRICES.HORIZONTAL_NUMBER,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };
        calculationHorizontalTable.on("click", selectableEntryClass, functionArguments, selectCell);
    }

    /**
     * Linking all elements which can be selected (results, cells, ...).
     * @param visualViewmodel {Object} - Model which is used for example to highlight cells.
     * @param calculationVerticalTable {Element} - The table storing the vertical gap costs.
     * @param calculationHorizontalTable {Element} - The table storing the horizontal gap costs.
     * @param iterationTablesArray {Array} - An array of tables.
     * @param mainOutput {Element} - The div containing only the calculation tables.
     * @param selectableEntryClass {Object} - The class name of a selectable entry.
     */
    function linkIterationTables(visualViewmodel, calculationVerticalTable, calculationHorizontalTable, iterationTablesArray,
                                 mainOutput, selectableEntryClass) {

        // first
        var functionArguments = {
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "iterationTablesArray": iterationTablesArray,
            "mainOutput": mainOutput,
            "number": MATRICES.ITERATION_NUMBER_1,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };

        iterationTablesArray[0].on("click", selectableEntryClass, functionArguments, selectCell);

        // second
        functionArguments = {
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "iterationTablesArray": iterationTablesArray,
            "mainOutput": mainOutput,
            "number": MATRICES.ITERATION_NUMBER_2,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };

        iterationTablesArray[1].on("click", selectableEntryClass, functionArguments, selectCell);

        // third
        functionArguments = {
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "iterationTablesArray": iterationTablesArray,
            "mainOutput": mainOutput,
            "number": MATRICES.ITERATION_NUMBER_3,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };

        iterationTablesArray[2].on("click", selectableEntryClass, functionArguments, selectCell);

        // fourth
        functionArguments = {
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "iterationTablesArray": iterationTablesArray,
            "mainOutput": mainOutput,
            "number": MATRICES.ITERATION_NUMBER_4,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };

        iterationTablesArray[3].on("click", selectableEntryClass, functionArguments, selectCell);

        // fifth
        functionArguments = {
            "calculationHorizontalTable": calculationHorizontalTable,
            "calculationVerticalTable": calculationVerticalTable,
            "iterationTablesArray": iterationTablesArray,
            "mainOutput": mainOutput,
            "number": MATRICES.ITERATION_NUMBER_5,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };

        iterationTablesArray[4].on("click", selectableEntryClass, functionArguments, selectCell);
    }

    /**
     * Selects a table entry and triggers a function of the visualizer to highlight the entry.
     * @param e - Stores data relevant to the event called that function.
     */
    function selectTableEntry(e) {
        // retrieve data
        var mainOutput = e.data.mainOutput[0];
        var calculationVerticalTable;
        var calculationTable = e.data.calculationTable[0];
        var calculationHorizontalTable;

        if (e.data.calculationVerticalTable !== undefined) {
            calculationVerticalTable = e.data.calculationVerticalTable[0];
            calculationHorizontalTable = e.data.calculationHorizontalTable[0];
        }

        var resultsTable = e.data.resultsTable;
        var selectableEntries = resultsTable.find(e.data.selectableEntryClass);
        var visualViewmodel = e.data.visualViewmodel;

        // compute the selected position in the results table
        var selectedRow = -1;

        for (var i = 0; i < selectableEntries.length; i++) {
            if (this === selectableEntries[i])
                selectedRow = i;
        }

        // some delay without it won't work properly
        setTimeout(function () {
            visualViewmodel.highlight(selectedRow, resultsTable[0]);
            visualViewmodel.showTraceback(selectedRow, calculationVerticalTable, calculationTable, calculationHorizontalTable, mainOutput);
        }, REACTION_TIME_HIGHLIGHT);
    }

    /**
     * Highlights a table cell and its neighbours by the help of a visualizer function
     * which shows the neighbours that were needed to compute its cell value.
     * @param e - Stores data relevant to the event called that function.
     */
    function selectCell(e) {
        debugger;
        // retrieve data
        var calculationHorizontalTable = e.data.calculationHorizontalTable;
        var calculationTable = e.data.calculationTable;
        var calculationVerticalTable = e.data.calculationVerticalTable;
        var visualViewmodel = e.data.visualViewmodel;

        var number = e.data.number;
        var mainOutput = e.data.mainOutput[0];
        var iterationTablesArray = e.data.iterationTablesArray;

        if (iterationTablesArray !== undefined)  // if table from an iteration
            calculationTable = iterationTablesArray[-(number + 1)];  // iteration number are negative in "defaults.js"

        var currentSelectedTable;
        var label;

        if (number === MATRICES.VERTICAL_NUMBER) {
            currentSelectedTable = calculationVerticalTable;
            label = MATRICES.VERTICAL;
        } else if (number === MATRICES.HORIZONTAL_NUMBER) {
            currentSelectedTable = calculationHorizontalTable;
            label = MATRICES.HORIZONTAL;
        } else {  // if (number === MATRICES.ITERATION_NUMBER_i || number === MATRICES.DEFAULT)
            currentSelectedTable = calculationTable;
            label = MATRICES.DEFAULT;
        }

        var selectableEntryClass = e.data.selectableEntryClass;
        var selectableEntries = currentSelectedTable.find(selectableEntryClass);

        // compute the selected position in the calculation table
        var selectedColumn = -1;
        var selectedRow = -1;

        var tableHeight = currentSelectedTable[0].rows.length - 1;
        var tableWidth = currentSelectedTable[0].rows[0].cells.length - 1;

        for (var i = 0; i < tableHeight; i++) {
            for (var j = 0; j < tableWidth; j++) {

                if (selectableEntries[i * tableWidth + j] === this) {
                    selectedColumn = j;
                    selectedRow = i;
                }
            }
        }

        // store selected position in a vector
        var cellCoordinates = new bases.alignment.Vector(selectedRow, selectedColumn);
        cellCoordinates.label = label;

        // some delay without it won't work properly
        setTimeout(function () {
            visualViewmodel.showFlow(cellCoordinates,
                calculationVerticalTable[0], calculationTable[0], calculationHorizontalTable[0], iterationTablesArray,
                mainOutput, -(number+1));  // MATRICES.ITERATION_NUMBER_i are negative
        }, REACTION_TIME_HIGHLIGHT);
    }

    /**
     * Updates the user interfaces of the loaded page.
     * @param algorithm {Object} - Algorithm used to update the user interface.
     * @param viewmodels {Object} - The viewmodels used to access visualization functions.
     * @param processInput {Function} - Function from the algorithm which should process the input.
     * @param changeOutput {Function} - Function from the algorithm which should change the output after processing the input.
     */
    function updateGUI(algorithm, viewmodels, processInput, changeOutput) {
        var inputs = $("#algorithm_input").find("input");

        inputs.on({
            keypress: function (e) {
                if (e.which === KEY_CODES.ENTER)
                    updateAfterTimeout(algorithm, viewmodels, processInput, changeOutput);
            },

            change: function () {
                updateAfterTimeout(algorithm, viewmodels, processInput, changeOutput);
                postProcess();
            }
        });
    }

    /**
     * Does post processing after some kind of input by keyboard or mouse.
     * @example
     * LaTeX-math is updated or wrong characters are removed.
     */
    function postProcess() {
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);  // reinterpret new LaTeX code
    }

    /**
     * Processes entered inputs with an algorithm to update the outputs.
     * @param algorithm {Object} - Algorithm used to update the user interface.
     * @param viewmodels {Object} - The viewmodels used to access visualization functions.
     * @param processInput {Function} - Function from the algorithm which should process the input.
     * @param changeOutput {Function} - Function from the algorithm which should change the output after processing the input.
     */
    function updateAfterTimeout(algorithm, viewmodels, processInput, changeOutput) {
        setTimeout(function () {  // to avoid using not updated values
            processInput(algorithm, inputProcessorInstance, viewmodels.input, viewmodels.visual);
            changeOutput(algorithm.getOutput(), inputProcessorInstance, viewmodels);
            postProcess();
        }, REUPDATE_TIMEOUT_MS);
    }

    /**
     * Post edits a matrix and replaces for example values with LaTeX-symbols.
     * @param matrix {matrix} - The matrix in which you want replace values with for example LaTeX-symbols.
     * @param visualViewmodel {Object} - The model for visualization which is replacing symbols.
     * @return {matrix} - The matrix in which symbols where replaced with LaTeX-symbols.
     */
    function postEdit(matrix, visualViewmodel) {
        return visualViewmodel.replaceInfinityStrings(matrix);
    }
}());
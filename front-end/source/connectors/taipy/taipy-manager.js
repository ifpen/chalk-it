/**
 * Manages the interaction between Chalk-it and Taipy.
 * It primarily handles the creation, updating, and deletion of dataNodes and
 * sending updated values to Taipy.
 *
 * @class
 */
class TaipyManager {
  #app;
  #currentContext;
  #variableData;
  #deletedDnConnections;
  #endAction;

  /**
   * Constructs a new TaipyManager instance.
   *
   * @constructor
   */
  constructor() {
    this.#app = {};
    this.#currentContext = '';
    this.#variableData = {};
    this.#deletedDnConnections = new Set();
    this.#endAction = undefined;
  }

  /**
   * Initializes the Taipy application by creating an app instance and setting up change detection.
   *
   * @method initTaipyApp
   * @public
   * @returns {void} This method does not return a value.
   */
  initTaipyApp() {
    this.app = TaipyGuiBase.createApp(this.onInit.bind(this));
    this.app.onChange = this.onChange.bind(this);
  }

  /**
   * Callback function executed upon initialization of the Taipy app.
   *
   * @method onInit
   * @public
   * @param {TaipyGuiBase} app - The initialized Taipy application instance.
   * @returns {void} This method does not return a value.
   */
  onInit(app) {
    this.currentContext = app.getContext();
    this.processVariableData();
  }

  /**
   * Processes variable data, creating or deleting dataNodes based on changes.
   * It updates the variable data if there are changes in the current context.
   *
   * @method processVariableData
   * @public
   * @returns {void} This method does not return a value.
   */
  processVariableData() {
    const currentContext = this.currentContext;
    const dataTree = this.app.getDataTree();
    if (this.currentContext !== this.app.getContext()) return;

    const currentVariables = this.#deepClone(this.variableData)[currentContext] || {};
    const newVariables = this.#deepClone(dataTree)[currentContext] || {};

    // Performs a deep comparison
    if (_.isEqual(newVariables, currentVariables)) return;

    // Update variableData
    this.variableData[currentContext] = this.#deepClone(newVariables);
    this.deletedDnConnections.clear();

    //Variables that will be ignored (do not create a dataNode)
    const fileVariables = new Set(['base_path', 'file_name', 'has_file_saved', 'json_data', 'file_list']);

    // Combine current and new variable names to iterate over
    const variableNames = new Set([...Object.keys(currentVariables), ...Object.keys(newVariables)]);

    // Filter variableNames to exclude fileVariables
    [...variableNames].forEach((variableName) => {
      if (fileVariables.has(variableName)) {
        variableNames.delete(variableName);
      }
    });

    variableNames.forEach((variableName) => {
      this.#processDataNode(variableName, currentVariables[variableName], newVariables[variableName]);
    });

    this.#showDeletedDataNodeAlert(this.deletedDnConnections);
  }

  /**
   * Sends updated value to Taipy.
   *
   * @method sendToTaipy
   * @public
   * @param {string} valueName - The name of the value (name of the dataNode).
   * @param {*} newValue - The value to be sent (value of the dataNode).
   * @returns {void} This method does not return a value.
   */
  sendToTaipy(valueName, newValue) {
    const currentContext = this.currentContext;
    if (currentContext !== this.app.getContext()) return;

    const encodedName = this.app.getEncodedName(valueName, currentContext);
    const currentValue = this.variableData[currentContext][valueName].value;
    // Performs a deep comparison
    if (_.isEqual(currentValue, newValue)) return; // Current simple solution. To be enhanced in the future
    // Send newValue
    this.app.update(encodedName, newValue);
  }

  /**
   * Callback function handles changes to variables within the application.
   *
   * @method onChange
   * @public
   * @param {Object} app - The application instance.
   * @param {string} encodedName - The encoded name of the variable.
   * @param {*} newValue - The new value of the variable.
   * @returns {void} This method does not return a value.
   */
  onChange(app, encodedName, newValue) {
    const [valueName, context] = app.getName(encodedName);
    if (this.currentContext !== context) return;

    // Update variableData
    this.variableData[context][valueName].value = this.#deepClone(newValue);

    // saveFile
    if (encodedName.includes('has_file_saved') && newValue === true) {
      if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
        this.endAction('', '', 'success');
        this.endAction = undefined;
      }
      this.app.update(encodedName, false);
    }

    // fileSelect
    if (encodedName.includes('file_name')) {
      this.loadFile();
    }

    // loadFile
    if (encodedName.includes('json_data')) {
      const jsonData = this.variableData[context][valueName].value;
      xdash.openProjectManager(jsonData);
    }

    // getFileList
    if (encodedName.includes('file_list')) {
      if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
        const fileList = JSON.parse(this.variableData[context][valueName].value);
        this.endAction(fileList);
        this.endAction = undefined;
      }
    }

    if (!datanodesManager.foundDatanode(valueName)) return;
    this.#updateDataNode(valueName, newValue);
  }

  /**
   * This function allows to save the file in the base directory which defined in the Taipy page.
   * The data is passed as a JSON string, formatted with tab indentation, to enhance readability.
   *
   * @remarks
   * - If the file doesn't already exist, it will create a new one and store the xprjson data in it.
   *
   * @method saveFile
   * @public
   * @param {Object} xprjson - The object to be saved, which will be converted to a JSON string.
   * @returns {void} This method does not return a value.
   */
  saveFile(xprjson) {
    this.app.trigger('save_file', 'action1', { data: JSON.stringify(xprjson, null, '\t') });
  }

  /**
   * Triggers an event when a user selects a file, specifying the file name.
   * This function allows to update the file path in the Taipy page.
   *
   * @remarks
   * - The file must be in the same directory as the base directory specified in the Taipy page.
   * - Once the file is selected, it can be opened using the loadFile function.
   *
   * @method fileSelect
   * @public
   * @param {string} fileName - Name of the selected file.
   * @returns {void} This method does not return a value.
   */
  fileSelect(fileName) {
    this.app.trigger('select_file', 'action1', { file_name: fileName });
  }

  /**
   * Triggers a request to obtain a file_list object from the specified base path in Taipy page.
   * The file_list object includes the base path and a list of file names with the .xprjson extension.
   *
   * @remarks
   * - This method does not return the file list directly; it merely initiates the process of retrieving it.
   * - The event triggered by this method should be handled to process the file_list object, which will have the following structure:
   *   {
   *     "base_path": "string - the path to the directory searched",
   *     "file_list": ["string - file name with the .xprjson extension", ...]
   *   }
   *
   * @method getFileList
   * @public
   * @returns {void} This method does not return a value.
   */
  getFileList() {
    this.app.trigger('get_file_list', 'action1');
  }

  /**
   * Triggers an event to load a file from a specified path.
   *
   * This method emits an event to signal the application to read a file.
   * The path of the file to load must be specified in the Taipy page and can be modified using the fileSelect function.
   *
   * @remarks
   * - The file to be loaded can be modified by passing the name of the new file to the fileSelect function.
   * - The new file must be in the same directory as the current file.
   * - The directory path must be specified in the Taipy page.
   *
   * @method loadFile
   * @public
   * @returns {void} This method does not return a value.
   */
  loadFile() {
    this.app.trigger('load_file', 'action1');
  }

  // TODO
  // Upload a file (create a temporary file)
  uploadFile(event) {
    const files = event.target.files;
    const encodedVarName = this.app.getEncodedName('file_name', 'demo_decouple_meet_1.mainpage');
    console.log(files, encodedVarName);
    const printProgressUpload = (progress) => {
      console.log(progress);
    };
    if (files?.length) {
      this.app.upload(encodedVarName, files, printProgressUpload).then(
        (value) => {
          console.log('upload successful', value);
        },
        (reason) => {
          console.log('upload failed', reason);
        }
      );
    }
  }

  /**
   * Clears all data for the current context.
   * This method sets the data associated with the current context to an empty object,
   *
   * @method clearData
   * @public
   * @returns {void} This method does not return a value.
   */
  clearData() {
    this.variableData[this.currentContext] = {};
  }

  /**
   * Processes a single dataNode, creating or deleting it based on the presence of new and current variables.
   *
   * @method processDataNode
   * @private
   * @param {string} dataNodeName - The name of the dataNode to be processed.
   * @param {Object} currentVariable - The current variable data.
   * @param {Object} newVariable - The new variable data.
   * @returns {void} This method does not return a value.
   */
  #processDataNode(dataNodeName, currentVariable, newVariable) {
    if (newVariable && !currentVariable) {
      const value = newVariable.value;
      this.#createDataNode(dataNodeName, value);
    } else if (!newVariable && currentVariable) {
      this.#deleteDataNode(dataNodeName);
    }
  }

  /**
   * Creates a new dataNode.
   *
   * @method createDataNode
   * @private
   * @param {string} dnName - The dataNode name.
   * @param {*} value - The value for the dataNode.
   * @returns {void} This method does not return a value.
   */
  #createDataNode(dnName, value) {
    const types = datanodesManager.getDataNodePluginTypes();
    const viewModel = null;
    const dataNodeSettings = {
      type: 'taipy_link_plugin',
      iconType: '',
      settings: {
        name: dnName,
        json_var: JSON.stringify(value),
      },
    };
    const selectedType = types[dataNodeSettings.type];

    // Check if a datanode already exists
    if (!datanodesManager.foundDatanode(dnName)) {
      datanodesManager.settingsSavedCallback(viewModel, dataNodeSettings, selectedType);
    }
  }

  /**
   * Deletes an existing dataNode.
   *
   * @method deleteDataNode
   * @private
   * @param {string} dnName - The dataNode name.
   * @returns {void} This method does not return a value.
   */
  #deleteDataNode(dnName) {
    if (datanodesManager.foundDatanode(dnName)) {
      const viewModel = datanodesManager.getDataNodeByName(dnName);
      datanodesManager.deleteTaipyDataNode(viewModel, dnName);
    }
  }

  /**
   * Displays a SweetAlert modal with details of deleted dataNode connections.
   *
   * @method showDeletedDataNodeAlert
   * @private
   * @param {Set<Object>} deletedDnConnections - Set of deleted dataNode connection objects.
   * @returns {void} This method does not return a value.
   */
  #showDeletedDataNodeAlert(deletedDnConnections) {
    if (deletedDnConnections.size !== 0) {
      let text = 'The following dataNode(s) and connection(s) with widget(s) is/are deleted !';
      for (const dnConnection of deletedDnConnections) {
        text += `<br><br>- "${dnConnection.dnName}":<br>${dnConnection.wdList.join('<br>')}`;
      }
      const content = `<div style="max-height: 150px; overflow-y: auto;">${text}</div>`;
      swal({
        title: 'Deleted datanode(s)',
        type: 'warning',
        html: true,
        text: content,
        showConfirmButton: true,
        confirmButtonText: 'Ok',
        closeOnConfirm: true,
      });
    }
  }

  /**
   * Updates an existing dataNode.
   *
   * @method updateDataNode
   * @private
   * @param {string} dnName - The dataNode name.
   * @param {*} value - The new value for the dataNode.
   * @returns {void} This method does not return a value.
   */
  #updateDataNode(dnName, value) {
    const dnModel = datanodesManager.getDataNodeByName(dnName);
    const dataNodeSettings = {
      type: 'taipy_link_plugin',
      iconType: '',
      settings: {
        name: dnName,
        json_var: JSON.stringify(value),
      },
    };
    datanodesManager.updateDatanode(dnModel, dataNodeSettings);
  }

  /**
   * Creates a deep clone of the object if the input is a non-null object. If the object contains functions,
   * their references are copied. Returns the input value for non-object types.
   *
   * This function uses Lodash's _.cloneDeep, which handles complex objects including nested structures,
   * circular references, and maintains function references.
   *
   * @method deepClone
   * @private
   * @param {*} value - The value to check and deeply clone.
   * @returns {*} Deep clone of the input object, or the original value.
   */
  #deepClone(value) {
    return value !== null && typeof value === 'object' ? _.cloneDeep(value) : value;
  }

  /**
   * Sets the application instance. This updates the internal reference to the application.
   *
   * @method app
   * @public
   * @param {Object} newApp - The new application instance to be set.
   * @returns {void} This method does not return a value.
   */
  set app(newApp) {
    this.#app = newApp;
  }

  /**
   * Retrieves the current application instance being managed by the TaipyManager.
   *
   * @method app
   * @public
   * @returns {Object} The current application instance.
   */
  get app() {
    return this.#app;
  }

  /**
   * Sets the new context for the application instance.
   *
   * @method currentContext
   * @public
   * @param {string} newContext - The new context to set.
   * @returns {void} This method does not return a value.
   */
  set currentContext(newContext) {
    this.#currentContext = newContext;
  }

  /**
   * Gets the current context from the application instance.
   *
   * @method currentContext
   * @public
   * @returns {string} The current context.
   */
  get currentContext() {
    return this.#currentContext;
  }

  /**
   * Sets new variable data, updating the internal state.
   *
   * @method variableData
   * @public
   * @param {Object} newVariableData - The new variable data.
   * @returns {void} This method does not return a value.
   */
  set variableData(newVariableData) {
    this.#variableData = newVariableData;
  }

  /**
   * Gets the current variable data.
   *
   * @method variableData
   * @public
   * @returns {Object} The current variable data.
   */
  get variableData() {
    return this.#variableData;
  }

  /**
   * Sets the current set of deleted dataNode connections.
   *
   * @method deletedDnConnections
   * @public
   * @param {Set<Object>} newSet - A Set of objects representing deleted dataNode connections.
   * Each object should have properties:
   * - `dnName` (string): The name of the dataNode.
   * - `wdList` (Array<string>): An array of associated widget names.
   * @returns {void} This method does not return a value.
   */
  set deletedDnConnections(newSet) {
    this.#deletedDnConnections = newSet;
  }

  /**
   * Retrieves the current set of deleted dataNode connections.
   *
   * @method deletedDnConnections
   * @public
   * @returns {Set<Object>} The current set of deleted dataNode connection objects.
   */
  get deletedDnConnections() {
    return this.#deletedDnConnections;
  }

  /**
   * Gets the end action function.
   *
   * @method endAction
   * @public
   * @returns {Function} The current endAction function.
   */
  get endAction() {
    return this.#endAction;
  }

  /**
   * Sets a new end action function.
   *
   * @method endAction
   * @public
   * @param {Function} newEndAction - The new endAction function to be set.
   * @return {void} This method does not return a value.
   */
  set endAction(newEndAction) {
    if (typeof newEndAction === 'function' || newEndAction === undefined) {
      this.#endAction = newEndAction;
    } else {
      throw new Error('newEndAction must be a function or undefined');
    }
  }
}

const taipyManager = new TaipyManager();

if (xDashConfig.xDashLiteVersion === 'true') taipyManager.initTaipyApp();

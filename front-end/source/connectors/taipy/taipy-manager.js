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
  #xprjsonFileName;
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
    this.#xprjsonFileName = '';
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
   * @param {Object} app - The initialized Taipy application instance.
   * @returns {void} This method does not return a value.
   */
  onInit(app) {
    this.currentContext = app.getContext();
    this.xprjsonFileName = app.getDataTree()[this.currentContext]['xprjson_file_name']?.value ?? '';
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
    if (this.currentContext !== this.app.getContext()) return;
    this.#initFunctionList();
    const dataTree = this.app.getDataTree();
    if (currentContext === '__main__') {
      dataTree[currentContext] = Object.fromEntries(
        Object.entries(dataTree[currentContext]).filter(([key]) => !key.startsWith('gui'))
      );
    }
    const currentVariables = this.#deepClone(this.variableData)[currentContext] || {};
    const newVariables = this.#deepClone(dataTree)[currentContext] || {};

    // Performs a deep comparison
    if (_.isEqual(newVariables, currentVariables)) return;

    // Update variableData
    this.variableData[currentContext] = this.#deepClone(newVariables);
    this.deletedDnConnections.clear();

    // Variables that will be ignored (do not create a dataNode)
    const fileVariables = new Set(['xprjson_file_name', 'has_file_saved', 'json_data', 'file_list']);

    // Combine current and new variable names to iterate over
    const variableNames = new Set([...Object.keys(currentVariables), ...Object.keys(newVariables)]);

    // Filter variableNames to exclude fileVariables
    [...variableNames].forEach((variableName) => {
      if (fileVariables.has(variableName)) {
        variableNames.delete(variableName);
      }
    });

    variableNames.forEach((variableName) => {
      this.#processDataNode(variableName, newVariables[variableName]);
    });

    this.#showDeletedDataNodeAlert(this.deletedDnConnections);
  }

  /**
   * Sends updated value to Taipy.
   *
   * @method sendToTaipy
   * @public
   * @param {string} varName - The name of the variable (name of the dataNode).
   * @param {*} newValue - The value to be sent (value of the dataNode).
   * @returns {void} This method does not return a value.
   */
  sendToTaipy(varName, newValue) {
    const currentContext = this.currentContext;
    if (varName.startsWith('function:') || currentContext !== this.app.getContext()) return;

    const encodedName = this.app.getEncodedName(varName, currentContext);
    const currentValue = this.variableData[currentContext][varName].value;
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
    const [varName, context] = app.getName(encodedName);
    if (this.currentContext !== context) return;

    // Update variableData
    this.variableData[context][varName].value = this.#deepClone(newValue);

    // saveFile
    if (encodedName.includes('has_file_saved')) {
      const toSave = newValue;
      if (toSave) {
        this.app.update(encodedName, false);
      } else if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
        this.endAction(); // Do not assign an undefined value
      }
    }

    // fileSelect
    if (encodedName.includes('xprjson_file_name')) {
      this.loadFile();
    }

    // loadFile
    if (encodedName.includes('json_data')) {
      if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
        const jsonData = this.variableData[context][varName].value;
        this.endAction(jsonData);
        this.endAction = undefined;
      }
    }

    // getFileList
    if (encodedName.includes('file_list')) {
      if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
        const fileList = JSON.parse(this.variableData[context][varName].value);
        this.endAction(fileList);
        this.endAction = undefined;
      }
    }

    if (!datanodesManager.foundDatanode(varName)) return;
    this.#updateDataNode(varName, newValue);
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
   * @param {string} actionName - The name of the action to be triggered in the taipy page.
   * @returns {void} This method does not return a value.
   */
  saveFile(xprjson, actionName) {
    const action_name = actionName ?? 'first_action';
    this.app.trigger('save_file', action_name, { data: JSON.stringify(xprjson, null, '\t') });
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
    this.app.trigger('select_file', 'first_action', { xprjson_file_name: fileName });
  }

  /**
   * Triggers a request to obtain a file_list object from the specified base path in Taipy page.
   * The file_list object includes the base path and a list of file names with the .xprjson extension.
   *
   * @remarks
   * - This method does not return the file list directly; it merely initiates the process of retrieving it.
   * - The event triggered by this method should be handled to process the file_list object, which will have the following structure:
   *   {
   *     "file_names": ["string - file name with the .xprjson extension", ...]
   *     "base_path": "string - the path to the directory searched",
   *   }
   *
   * @method getFileList
   * @public
   * @returns {void} This method does not return a value.
   */
  getFileList() {
    this.app.trigger('get_file_list', 'first_action');
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
    this.app.trigger('load_file', 'first_action');
  }

  /**
   * Trigger an event to execute a Taipy function and submit the loaded file data from a file loader widget.
   *
   * @method functionTrigger
   * @public
   * @param {string} functionName - The name of the Taipy function to be executed.
   * @param {*} fileData - The data of the loaded file.
   * @returns {void} This method does not return a value.
   */
  functionTrigger(functionName, fileData) {
    this.app.trigger(functionName, 'first_action', { file_data: fileData });
  }

  /**
   * Uploads one or more files to the server by creating a temporary file in the directory and tracks the upload progress.
   * The directory path is defined in the "upload_folder" variable on the Taipy page.
   *
   * This function is designed to handle multiple files and execute a callback upon successful completion,
   * making it suitable for operations that require post-upload processing.
   *
   * @method uploadFile
   * @public
   * @param {FileList|Array} files - The files to be uploaded. This can be a FileList object or an array of File objects.
   * @param {Function} callback - A callback function to be executed upon successful upload of the files.
   * @returns {void} This method does not return a value.
   */
  uploadFile(files, callback) {
    const encodedVarName = this.app.getEncodedName('xprjson_file_name', this.currentContext);
    const printProgressUpload = (progress) => {
      console.log(progress);
    };
    if (files?.length) {
      this.app.upload(encodedVarName, files, printProgressUpload).then(
        (value) => {
          console.log('upload successful', value);
          callback();
        },
        (reason) => {
          console.log('upload failed', reason);
        }
      );
    }
  }

  /**
   * Create the dataNode according to the function name and delete the file management functions.
   *
   * If the dataNode doesn't yet exist, it will be created by adding the prefix "function:" to the function name.
   * The function names correspond to the function names on the taipy page.
   *
   * @method initFunctionList
   * @private
   * @returns {void} This method does not return a value.
   */
  #initFunctionList() {
    const functionList = this.app.getFunctionList();
    const rejectedFunctionSet = new Set(['on_change', 'load_file', 'save_file', 'select_file', 'get_file_list']);

    functionList.forEach((funcName) => {
      if (!rejectedFunctionSet.has(funcName)) {
        const dnName = funcName;
        if (!datanodesManager.foundDatanode(dnName)) {
          this.#createDataNode(dnName, funcName, { isFunction: true });
        }
      }
    });
  }

  /**
   * Processes a Taipy variable by managing its corresponding data node. It either creates a new data node if one does not exist
   * for the given Taipy variable or deletes the data node if the Taipy variable is undefined.
   *
   * @method processDataNode
   * @private
   * @param {string} varName - The name of the Taipy variable to process.
   * @param {*} variable - The value of the Taipy variable. If undefined, indicates that the variable is deleted.
   * @returns {void} This method does not return a value.
   */
  #processDataNode(varName, variable) {
    if (!datanodesManager.foundDatanode(varName)) {
      // Create the dataNode corresponding to the Taipy variable, if it doesn't already exist.
      const value = variable.value;
      this.#createDataNode(varName, value);
    } else if (variable === undefined) {
      // If the Taipy variable is deleted, the corresponding dataNode will be deleted.
      this.#deleteDataNode(varName);
    }
  }

  /**
   * Creates a new dataNode.
   *
   * @method createDataNode
   * @private
   * @param {string} dnName - The dataNode name.
   * @param {*} value - The value of the dataNode.
   * @param {Object} newProp - The new dataNode settings property.
   * @returns {void} This method does not return a value.
   */
  #createDataNode(dnName, value, newProp) {
    const types = datanodesManager.getDataNodePluginTypes();
    const viewModel = null;
    const dnSettings = {
      type: 'taipy_link_plugin',
      iconType: '',
      settings: {
        name: dnName,
        json_var: JSON.stringify(value),
      },
    };
    dnSettings.settings = { ...dnSettings.settings, ...(newProp ?? {}) };
    const selectedType = types[dnSettings.type];
    datanodesManager.settingsSavedCallback(viewModel, dnSettings, selectedType);
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
    const viewModel = datanodesManager.getDataNodeByName(dnName);
    datanodesManager.deleteTaipyDataNode(viewModel, dnName);
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
   * @param {*} value - The new value of the dataNode.
   * @returns {void} This method does not return a value.
   */
  #updateDataNode(dnName, value) {
    const dnModel = datanodesManager.getDataNodeByName(dnName);
    const dnSettings = {
      type: 'taipy_link_plugin',
      iconType: '',
      settings: {
        name: dnName,
        json_var: JSON.stringify(value),
      },
    };
    datanodesManager.updateDatanode(dnModel, dnSettings);
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
   * Gets the file name from the application instance.
   *
   * @method xprjsonFileName
   * @public
   * @returns {string} The current file name.
   */
  get xprjsonFileName() {
    return this.#xprjsonFileName;
  }

  /**
   * Sets the new file name for the application instance.
   *
   * @method xprjsonFileName
   * @public
   * @param {string} newFileName - The new file name.
   * @returns {void} This method does not return a value.
   */
  set xprjsonFileName(newFileName) {
    const $rootScope = angular.element(document.body).scope()?.$root;
    if ($rootScope.currentProject) {
      $rootScope.currentProject.name = newFileName;
    }
    this.#xprjsonFileName = newFileName;
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

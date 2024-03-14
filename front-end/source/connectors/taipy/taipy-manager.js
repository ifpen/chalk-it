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
  #ignoredVariables;

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
    // Variables that will be ignored (do not create a dataNode)
    this.#ignoredVariables = new Set([
      'xprjson_file_name',
      'upload_file_name',
      'has_file_saved',
      'json_data',
      'file_list',
    ]);
  }

  /**
   * Initializes the Taipy application by creating an app instance and setting up change detection.
   *
   * @method initTaipyApp
   * @public
   * @returns {void} This method does not return a value.
   */
  initTaipyApp() {
    try {
      this.app = TaipyGuiBase.createApp(this.onInit.bind(this));
      this.app.onChange = this.onChange.bind(this);
    } catch (error) {
      this.#handleError('Failed to initialize Taipy App', error);
    }
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
    if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
      // To load the xprjsonFileName if it exists
      this.endAction();
    }
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
    try {
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

      // Combine current and new variable names to iterate over
      const variableNames = new Set([...Object.keys(currentVariables), ...Object.keys(newVariables)]);

      // Filter variableNames to exclude ignoredVariables
      this.#ignoredVariables.forEach((ignoredVariable) => variableNames.delete(ignoredVariable));

      variableNames.forEach((variableName) => {
        this.#processDataNode(variableName, newVariables[variableName]);
      });

      this.#showDeletedDataNodeAlert(this.deletedDnConnections);
    } catch (error) {
      this.#handleError('Error processing variable data', error);
    }
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
    try {
      const currentContext = this.currentContext;
      if (varName.startsWith('function:') || currentContext !== this.app.getContext()) return;

      const encodedName = this.app.getEncodedName(varName, currentContext);
      const currentValue = this.variableData[currentContext][varName].value;
      // Performs a deep comparison
      if (_.isEqual(currentValue, newValue)) return; // Current simple solution. To be enhanced in the future
      // Send newValue
      this.app.update(encodedName, newValue);
    } catch (error) {
      this.#handleError(`Error sending updated value to Taipy for variable ${varName}`, error);
    }
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
    try {
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
    } catch (error) {
      this.#handleError(`Error handling change for variable ${encodedName}`, error);
    }
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
    try {
      const action_name = actionName ?? 'first_action';
      this.app.trigger('save_file', action_name, { data: JSON.stringify(xprjson, null, '\t') });
    } catch (error) {
      this.#handleError('Error saving file', error);
    }
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
    try {
      this.app.trigger('select_file', 'first_action', { xprjson_file_name: fileName });
    } catch (error) {
      this.#handleError('Error selecting file', error);
    }
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
    try {
      this.app.trigger('get_file_list', 'first_action');
    } catch (error) {
      this.#handleError('Error getting file list', error);
    }
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
    try {
      this.app.trigger('load_file', 'first_action');
    } catch (error) {
      this.#handleError('Error loading file', error);
    }
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
    try {
      this.app.trigger(functionName, 'first_action', { file_data: fileData });
    } catch (error) {
      this.#handleError(`Error triggering function ${functionName}`, error);
    }
  }

  /**
   * Asynchronously uploads one or more selected files to the server by creating a temporary file in a predefined directory,
   * while tracking and logging the upload progress. It executes a callback function upon the successful completion of all file uploads.
   * The directory path is defined in the "upload_folder" variable on the Taipy page.
   *
   * @method uploadFile
   * @public
   * @async
   * @param {Event} event - The event triggered by the file input element, used to get the selected files.
   * @param {Function} callback - A callback function to be called upon successful upload of the file.
   * @param {Function} displaySpinner - A function to control the display of a spinner during the upload process.
   * Accepts a string argument ('add' or 'remove') to show or hide the spinner, respectively.
   * @returns {Promise<void>} A promise that resolves when the upload process is complete. This method does not return any value,
   * but it ensures that the callback is called after the upload completion or the error notification is triggered upon failure.
   */
  async uploadFile(event, callback, displaySpinner) {
    try {
      const files = event.target.files;
      if (!files?.length) return;

      const notice = this.#notify('File uploading in progress...', '', 'info', 0, false);
      const encodedVarName = this.app.getEncodedName('upload_file_name', this.currentContext);
      displaySpinner('add');
      const printProgressUpload = (progress) => {
        notice.update({
          text: `[${progress.toFixed(1)}% completed]`,
        });
        console.log(progress.toFixed(2));
      };
      const result = await this.app.upload('', files, printProgressUpload);
      displaySpinner('remove');
      notice.remove();
      this.#notify('File upload', result, 'success', 2000);
      callback();
    } catch (error) {
      displaySpinner('remove');
      console.log('Upload failed', error);
      this.#notify('File upload', error, 'error', 2000);
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
   * Handles errors by displaying an alert to the user and logging the error to the console.
   *
   * @method handleError
   * @private
   * @param {string} message - The user-friendly error message to display in the alert.
   * @param {Error} error - The error object with details about the error. This is logged to the console.
   * @returns {void} This method does not return a value.
   */
  #handleError(message, error) {
    swal('Please check and reload the page', message, 'error');
    console.error(`${message}:`, error);
  }

  /**
   * Displays a notification using PNotify with the specified title, text, type, and delay.
   * This method allows for automatic closing of the notification after a specified delay
   * and gives users the option to manually close the notification by clicking on it.
   *
   * @method notify
   * @private
   * @param {string} title - The title of the notification to be displayed.
   * @param {string} text - The text content of the notification.
   * @param {string} type - The type of the notification, which determines the notification's styling.
   * @param {number} delay - The delay in milliseconds before the notification automatically closes.
   * @param {boolean} [hide=true] - Optional. Determines if the notification should be automatically hidden after the delay.
   * If set to false, the notification remains visible until manually closed by the user.
   * @returns {PNotify} Returns the PNotify instance created for the notification.
   */
  #notify(title, text, type, delay, hide = true) {
    const notice = new PNotify({ title, text, type, delay, hide, styling: 'bootstrap3' });
    $('.ui-pnotify-container').on('click', function () {
      notice.remove();
    });
    return notice;
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
   * Sets the new file name for the current project within the application instance.
   * This setter updates the project's name in the `$rootScope` if a current project is defined.
   *
   * @method xprjsonFileName
   * @public
   * @param {string} newFileName - The new file name to be set for the current project, including the ".xprjson" extension.
   * @returns {void} This method does not return a value.
   */
  set xprjsonFileName(newFileName) {
    const $rootScope = angular.element(document.body).scope()?.$root;
    if ($rootScope.currentProject) {
      const projectName = newFileName.replace('.xprjson', '');
      $rootScope.currentProject.name = projectName;
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

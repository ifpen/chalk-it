/**
 * Manages the interaction between Chalk-it and Taipy.
 * It primarily handles the creation, updating, and deletion of dataNodes and sending updated values to Taipy.
 *
 * @class
 */
class TaipyManager {
  #app;
  #runMode;
  #currentContext;
  #xprjsonFileName;
  #variableData;
  #deletedDnConnections;
  #endAction;
  #ignoredVariables;
  #ignoredFunctions;

  /**
   * Constructs a new TaipyManager instance.
   *
   * @constructor
   */
  constructor() {
    this.#app = {};
    this.#runMode = '';
    this.#currentContext = '';
    this.#xprjsonFileName = '';
    this.#variableData = {};
    this.#deletedDnConnections = new Set();
    this.#endAction = undefined;
    // Variables that will be ignored (do not create a dataNode)
    this.#ignoredVariables = new Set(['chlkt_json_data_', 'chlkt_file_list_', 'TaipyOnInit']);
    // Functions that will be ignored
    this.#ignoredFunctions = new Set(['on_change', 'chlkt_load_file_', 'chlkt_save_file_', 'chlkt_get_file_list_']);
  }

  /**
   * Initializes the Taipy application, setting the running mode, and configuring the app instance
   * with necessary event handlers.
   * This setup includes change detection and notification handling to ensure the app's responsive
   * behavior and error management.
   *
   * @method initTaipyApp
   * @public
   * @param {string} runMode - Specifies the running mode of the application, which can be either 'runtime' or 'studio'.
   *                           The 'runtime' mode is typically used for production environments,
   *                           while 'studio' mode is used during development within a dashboard.
   * @returns {void} This method does not return a value.
   */
  initTaipyApp(runMode) {
    try {
      this.#runMode = runMode;
      this.app = TaipyGuiBase.createApp(this.#onInit.bind(this));
      this.app.onChange = this.#onChange.bind(this);
      this.app.onNotify = this.#onNotify.bind(this);
    } catch (error) {
      this.#handleError('Failed to initialize Taipy App', error);
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
      if (currentContext !== this.app.getContext()) return;

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
      this.app.trigger('chlkt_save_file_', action_name, {
        data: JSON.stringify(xprjson, null, '\t'),
        xprjson_file_name: this.xprjsonFileName,
      });
    } catch (error) {
      this.#handleError('Error saving file', error);
    }
  }

  /**
   * Triggers an event to load a file.
   * This method emits an event to signal the application to read a file, facilitating
   * the process of loading content dynamically based on the file name provided.
   *
   * @method loadFile
   * @public
   * @param {string} fileName - Name of the file to be loaded.
   * @returns {void} This method does not return a value.
   */
  loadFile(fileName) {
    try {
      this.app.trigger('chlkt_load_file_', 'first_action', { xprjson_file_name: fileName });
    } catch (error) {
      this.#handleError('Error loading file', error);
    }
  }

  /**
   * Triggers a request to obtain a chlkt_file_list_ object from the specified base path in Taipy page.
   * The chlkt_file_list_ object includes the base path and a list of file names with the .xprjson extension.
   *
   * @remarks
   * - This method does not return the file list directly; it merely initiates the process of retrieving it.
   * - The event triggered by this method should be handled to process the chlkt_file_list_ object, which will have the following structure:
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
      this.app.trigger('chlkt_get_file_list_', 'first_action');
    } catch (error) {
      this.#handleError('Error getting file list', error);
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
   * @param {string} varFilePath - The variable that will be defined as the file path.
   * @param {Function} callback - A callback function to be called upon successful upload of the file.
   * @param {Function} displaySpinner - A function to control the display of a spinner during the upload process.
   * Accepts a string argument ('add' or 'remove') to show or hide the spinner, respectively.
   * @returns {Promise<void>} A promise that resolves when the upload process is complete. This method does not return any value,
   * but it ensures that the callback is called after the upload completion or the error notification is triggered upon failure.
   */
  async uploadFile(event, varFilePath, callback, displaySpinner) {
    try {
      const files = event.target.files;
      if (!files?.length) return;

      const fileName = event.target.files[0].name;
      const notice = this.#notify('File uploading in progress...', '', 'info', 0, false);
      const encodedVarName = this.app.getEncodedName(varFilePath, this.currentContext);
      displaySpinner('add');
      const printProgressUpload = (progress) => {
        notice.update({
          text: `[${progress.toFixed(1)}% completed]`,
        });
        // console.log(progress.toFixed(2));
      };
      const result = await this.app.upload(encodedVarName, files, printProgressUpload);
      displaySpinner('remove');
      notice.remove();
      this.#notify('File upload', `${fileName} uploaded successfully!`, 'success', 2000);
      callback();
    } catch (error) {
      displaySpinner('remove');
      console.log('Upload failed', error);
      this.#notify('File upload', error, 'error', 2000);
    }
  }

  /**
   * Callback function executed upon initialization of the Taipy app.
   *
   * @method onInit
   * @private
   * @param {Object} app - The initialized Taipy application instance.
   * @returns {void} This method does not return a value.
   */
  #onInit(app) {
    this.currentContext = app.getContext();
    this.xprjsonFileName = app.getPageMetadata()['xprjson_file_name'];
    if (this.#runMode == 'runtime') this.processVariableData();
    if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
      // To load the xprjsonFileName if it exists
      this.endAction();
    }
  }

  /**
   * Callback function handles changes to variables within the application.
   *
   * @method onChange
   * @private
   * @param {Object} app - The application instance.
   * @param {string} encodedName - The encoded name of the variable.
   * @param {*} newValue - The new value of the variable.
   * @returns {void} This method does not return a value.
   */
  #onChange(app, encodedName, newValue) {
    try {
      const [varName, context] = app.getName(encodedName);
      if (this.currentContext !== context) return;

      if (this.variableData[context] && Object.keys(this.variableData[context]).length !== 0) {
        // Update variableData
        this.variableData[context][varName].value = this.#deepClone(newValue);
      }

      // loadFile
      if (encodedName.includes('chlkt_json_data_')) {
        if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
          this.endAction(newValue); // newValue contains xprjson data
          this.endAction = undefined;
        }
      }

      // getFileList
      if (encodedName.includes('chlkt_file_list_')) {
        if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
          const fileList = JSON.parse(newValue);
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
   * Handles notification messages related to application events.
   *
   * @method onNotify
   * @private
   * @param {Object} app - The application instance.
   * @param {string} type - The type of message received, expected to be one of the predefined MESSAGE_TYPES.
   * @param {string} message - The message content, expected to be one of the predefined ACTIONS.
   * @returns {void} This method does not return a value.
   */
  #onNotify(app, type, message) {
    const MESSAGE_TYPES = { INFO: 'I', ERROR: 'E' };
    const ACTIONS = { LOAD_FILE: 'load_file', SAVE_FILE: 'save_file' };
    switch (message.action_name) {
      case ACTIONS.LOAD_FILE:
        if (type == MESSAGE_TYPES.INFO) {
          // This case is handled in the #onChange function
        } else if (type == MESSAGE_TYPES.ERROR) {
          this.#notify('Info project', 'Error while opening project', 'error', 2000);
        }
        break;
      case ACTIONS.SAVE_FILE:
        if (type == MESSAGE_TYPES.INFO) {
          if (!_.isUndefined(this.endAction) && _.isFunction(this.endAction)) {
            this.endAction(); // Do not assign undefined value: used in Open function
          }
        } else if (type == MESSAGE_TYPES.ERROR) {
          datanodesManager.showLoadingIndicator(false);
          this.#notify('Info project', 'Error while saving project', 'error', 2000);
        }
        break;
    }
  }

  /**
   * Initializes the list of available functions by creating corresponding dataNodes for each, excluding specific file management functions.
   *
   * This method iterates through the list of function names retrieved from the application,
   * and for each function name that is not in the set of excluded file management functions
   *
   * @method initFunctionList
   * @private
   * @returns {void} This method does not return a value.
   */
  #initFunctionList() {
    const functionList = this.app.getFunctionList();
    functionList.forEach((funcName) => {
      if (!this.#ignoredFunctions.has(funcName)) {
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

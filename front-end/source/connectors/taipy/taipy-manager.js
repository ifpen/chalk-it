/**
 * Manages the interaction between Chalk-it and Taipy.
 * It primarily handles the creation, updating, and deletion of dataNodes and
 * sending updated values to Taipy.
 */
class TaipyManager {
  #app;
  #variableData;
  #deletedDnConnections;
  #currentContext;

  /**
   * Constructs a new TaipyManager instance.
   */
  constructor() {
    this.#app = {};
    this.#variableData = {};
    this.#deletedDnConnections = new Set();
    this.#currentContext = '';
    this.initTaipyApp();
  }

  /**
   * Initializes the Taipy application by creating an app instance and setting up change detection.
   *
   * @returns {void} This method does not return a value.
   * @public
   */
  initTaipyApp() {
    this.app = TaipyGuiBase.createApp(this.onInit.bind(this));
    this.app.onChange = this.onChange.bind(this);
  }

  /**
   * Callback function executed upon initialization of the Taipy app.
   *
   * @param {TaipyGuiBase} app - The initialized Taipy application instance.
   * @returns {void} This method does not return a value.
   * @public
   */
  onInit(app) {
    this.currentContext = app.getContext();
    this.checkForChanges();
  }

  /**
   * Checks for changes in the application's data tree.
   *
   * @returns {void} This method does not return a value.
   * @method
   * @public
   */
  checkForChanges() {
    const currentContext = this.currentContext;
    if (currentContext !== this.app.getContext()) return;

    const newDataVariable = this.app.getDataTree()[currentContext];
    const currentDataVariable = this.variableData[currentContext];
    // Performs a deep comparison
    if (_.isEqual(newDataVariable, currentDataVariable)) return;
    this.#processVariableData();
  }

  /**
   * Sends updated value to Taipy.
   *
   * @param {string} valueName - The name of the value (name of the dataNode).
   * @param {*} newValue - The value to be sent (value of the dataNode).
   * @returns {void} This method does not return a value.
   * @method
   * @public
   */
  sendToTaipy(valueName, newValue) {
    const currentContext = this.currentContext;
    if (currentContext !== this.app.getContext() || !this.app.getDataTree().hasOwnProperty(currentContext)) return;

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
   * @param {Object} app - The application instance.
   * @param {string} valueName - The name of the variable.
   * @param {*} newValue - The new value of the variable.
   * @returns {void} This method does not return a value.
   * @method
   * @public
   */
  onChange(app, valueName, newValue) {
    const [varName, context] = app.getName(valueName);
    if (this.currentContext !== context || !app.getDataTree().hasOwnProperty(context)) return;

    // Update variableData
    this.variableData[context][varName].value = this.#deepCloneIfObject(newValue);
    if (!datanodesManager.foundDatanode(varName)) return;
    this.#updateDataNode(varName, newValue);
  }

  /**
   * Processes variable data, creating or deleting data nodes based on changes.
   * It updates the variable data if there are changes in the current context.
   *
   * @returns {void} This method does not return a value.
   * @method
   * @private
   */
  #processVariableData() {
    const currentContext = this.currentContext;
    if (!this.app.getDataTree().hasOwnProperty(currentContext)) return;

    const currentVariables = this.#deepCloneIfObject(this.variableData)[currentContext] || {};
    const newVariables = this.#deepCloneIfObject(this.app.getDataTree())[currentContext] || {};

    // Performs a deep comparison
    if (_.isEqual(newVariables, currentVariables)) return;

    // Update variableData
    this.variableData[currentContext] = this.#deepCloneIfObject(newVariables);
    this.deletedDnConnections = new Set();

    // Combine current and new variable names to iterate over
    const variableNames = new Set([...Object.keys(currentVariables), ...Object.keys(newVariables)]);
    for (const variableName of variableNames) {
      this.#processDataNode(variableName, currentVariables[variableName], newVariables[variableName]);
    }
    this.#showDeletedDataNodeAlert(this.deletedDnConnections);
  }

  /**
   * Processes a single dataNode, creating or deleting it based on the presence of new and current variables.
   *
   * @param {string} dataNodeName - The name of the dataNode to be processed.
   * @param {Object} currentVariable - The current variable data.
   * @param {Object} newVariable - The new variable data.
   * @returns {void} This method does not return a value.
   * @method
   * @private
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
   * @param {string} dnName - The dataNode name.
   * @param {*} value - The value for the dataNode.
   * @returns {void} This method does not return a value.
   * @method
   * @private
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
   * @param {string} dnName - The dataNode name.
   * @returns {void} This method does not return a value.
   * @method
   * @private
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
   * @param {Set<Object>} deletedDnConnections - Set of deleted dataNode connection objects.
   * Each object in the set has a structure like:
   *    {
   *      dnName: "DataNode1",     // Name of the dataNode
   *      wdList: ["Widget1", "Widget2", "Widget3"] // List of associated widgets
   *    }
   * @returns {void} This method does not return a value.
   * @method
   * @private
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
   * @param {string} dnName - The dataNode name.
   * @param {*} value - The new value for the dataNode.
   * @returns {void} This method does not return a value.
   * @method
   * @private
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
   * @param {*} value - The value to check and deeply clone.
   * @returns {*} Deep clone of the input object, or the original value.
   * @method
   * @private
   */
  #deepCloneIfObject(value) {
    return value !== null && typeof value === 'object' ? _.cloneDeep(value) : value;
  }

  /**
   * Sets new variable data, updating the internal state.
   *
   * @param {Object} newVariableData - The new variable data.
   * @returns {void} This method does not return a value.
   * @method
   * @public
   */
  set variableData(newVariableData) {
    this.#variableData = newVariableData;
  }

  /**
   * Gets the current variable data.
   *
   * @returns {Object} The current variable data.
   * @method
   * @public
   */
  get variableData() {
    return this.#variableData;
  }

  /**
   * Sets the application instance. This updates the internal reference to the application.
   *
   * @param {Object} newApp - The new application instance to be set.
   * @returns {void} This method does not return a value.
   * @method
   * @public
   */
  set app(newApp) {
    this.#app = newApp;
  }

  /**
   * Retrieves the current application instance being managed by the TaipyManager.
   *
   * @returns {Object} The current application instance.
   * @method
   * @public
   */
  get app() {
    return this.#app;
  }

  /**
   * Sets the current set of deleted dataNode connections.
   *
   * @param {Set<Object>} newSet - A set of objects representing the
   *        deleted dataNode connections. Each object in the set should have
   *        a specific structure, typically including properties like
   *        `dnName` (the name of the dataNode) and `wdList` (an array of
   *        associated widget names).
   * @returns {void} This method does not return a value.
   * @method
   * @public
   */
  set deletedDnConnections(newSet) {
    this.#deletedDnConnections = newSet;
  }

  /**
   * Retrieves the current set of deleted dataNode connections.
   *
   * @returns {Set<Object>} The current set of deleted dataNode connection objects.
   * @method
   * @public
   */
  get deletedDnConnections() {
    return this.#deletedDnConnections;
  }

  /**
   * Sets the new context for the application instance.
   *
   * @param {string} newContext - The new context to set.
   * @returns {void} This method does not return a value.
   * @method
   * @public
   */
  set currentContext(newContext) {
    this.#currentContext = newContext;
  }

  /**
   * Gets the current context from the application instance.
   *
   * @returns {string} The current context.
   * @method
   * @public
   */
  get currentContext() {
    return this.#currentContext;
  }
}

const taipyManager = new TaipyManager();

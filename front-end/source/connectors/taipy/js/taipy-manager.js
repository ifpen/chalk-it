/**
 * Manages the interaction between Chalk-it and Taipy.
 * It primarily handles the creation, updating, and deletion of data nodes and
 * sending updated values to Taipy.
 */
class TaipyManager {
  /**
   * Constructs a new TaipyManager instance.
   */
  constructor() {
    this._app = {};
    this._variableData = {};
    this._dataNodeSettings = {
      type: 'to_taipy_plugin',
      iconType: '',
      settings: {
        name: '',
        json_var: '',
      }
    };
  }

  /**
   * Updates internal variable data by processing each application variable and
   * creates corresponding data nodes
   */
  processVariableData() {
    // Update variableData when use_reloader is true
    this.variableData = this.app.getDataTree();

    Object.entries(this.variableData).forEach(([context, variables]) => {
      if (context === '__main__') return;
  
      Object.entries(variables).forEach(([variable, data]) => {
        const dnName = `${context}.${variable}`;
        this._createNewDataNode(dnName, data.value);
      });
    });
  }

  /**
   * Handles changes to variables within the application.
   * 
   * @param {Object} app - The application instance.
   * @param {string} varName - The name of the variable.
   * @param {*} value - The new value of the variable.
   */
  onChange(app, varName, value) {
    const [variable, context] = app.getName(varName);
    const dnName = `${context}.${variable}`;
    if (datanodesManager.foundDatanode(dnName)) {
      this._updateDataNode(dnName, value);
    }
  }

  /**
   * Sends updated value to Taipy.
   * 
   * @param {string} dataNodeName - The name of the data node.
   * @param {*} value - The value to be sent.
   */
  sendToTaipy(dataNodeName, value) {
    const idSplit = Array.from(dataNodeName.split("."));
    const [context, varName] = idSplit.reduce((acc, curr, idx) => {
        if (idx === 0 || idx === idSplit.length - 1) {
            acc.push(curr);
        } else {
            acc[0] = `${acc[0]}.${curr}`;
        }
        return acc;
    }, []);
    const encodedName = window.taipyApp.getEncodedName(varName, context)
    const oldValue = this.variableData[context][varName].value;
    this.variableData[context][varName].value = value;
    if (oldValue !== value) { // MBG, in contradiction with Chalk'it dataflow principles. To be discussed.
      window.taipyApp.update(encodedName, value);
    }
  }

  /**
   * Creates a new data node.
   * 
   * @private
   * @param {string} dnName - The data node name.
   * @param {*} value - The value for the data node.
   */
  _createNewDataNode(dnName, value) {
    const types = datanodesManager.getDataNodePluginTypes();
    const viewModel = null;
    const settings = this.dataNodeSettings;
    settings.settings.name = dnName;
    settings.settings.json_var = JSON.stringify(value);
    const selectedType = types[settings.type];

    // Check if a datanode is already exists
    if (!datanodesManager.foundDatanode(dnName)) {
      datanodesManager.settingsSavedCallback(viewModel, settings, selectedType);
    }
  }

  /**
   * Updates an existing data node.
   * 
   * @private
   * @param {string} dnName - The data node name.
   * @param {*} value - The new value for the data node.
   */
  _updateDataNode(dnName, value) {
    const dnModel = datanodesManager.getDataNodeByName(dnName);
    const settings = this.dataNodeSettings;
    settings.settings.name = dnName;
    settings.settings.json_var = JSON.stringify(value);
    datanodesManager.updateDatanode(dnModel, settings);
  }

  /**
   * Sets new variable data, updating the internal state.
   * 
   * @param {Object} newVariableData - The new variable data.
   */
  set variableData(newVariableData) {
    this._variableData = newVariableData;
  }

  /**
   * Gets the current variable data.
   * 
   * @returns {Object} The current variable data.
   */
  get variableData() {
    return this._variableData;
  }

  /**
   * Sets the application instance. This updates the internal reference to the application.
   * 
   * @param {Object} newApp - The new application instance to be set.
   */
  set app(newApp) {
    this._app = newApp;
  }

  /**
   * Retrieves the current application instance being managed by the TaipyManager.
   * 
   * @returns {Object} The current application instance.
   */
  get app() {
    return this._app;
  }

  /**
   * Retrieves the current settings for data nodes managed by the TaipyManager.
   * 
   * @returns {Object} The current settings for data nodes.
   */
  get dataNodeSettings() {
    return this._dataNodeSettings;
  }
}

const taipyManager = new TaipyManager();

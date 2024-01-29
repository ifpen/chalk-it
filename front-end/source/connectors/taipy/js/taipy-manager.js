/**
 * Manages the interaction between Chalk-it and Taipy.
 * It primarily handles the creation, updating, and deletion of dataNodes and
 * sending updated values to Taipy.
 */
class TaipyManager {
  /**
   * Constructs a new TaipyManager instance.
   */
  constructor() {
    this._app = {};
    this._variableData = {};
    this._deletedDnConnections = new Set();
    this._dataNodeSettings = {
      type: 'to_taipy_plugin',
      iconType: '',
      settings: {
        name: '',
        json_var: '',
      }
    };
    setInterval(() => this._checkForChanges(), 1000); // Check every second
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
   * @param {string} dataNodeName - The name of the dataNode.
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
   * Checks for changes in the application's data tree.
   * 
   * @method
   * @private
   */
  _checkForChanges() {
    const newData = this.app.getDataTree();
    if (JSON.stringify(newData) !== JSON.stringify(this.variableData)) {
        this._processVariableData();
    }
  }

  /**
   * Updates internal variable data by processing each application variable and
   * creates corresponding dataNodes
   * 
   * @method
   * @private
   */
  _processVariableData() {
    this.deletedDnConnections = new Set();
    const oldVariableData = this.variableData;
    // Update variableData when use_reloader is true
    this.variableData = this.app.getDataTree();
    const contexts = new Set([...Object.keys(oldVariableData), ...Object.keys(this.variableData)]);

    contexts.forEach(context => {
        if (context === '__main__') return;

        const oldVariables = oldVariableData[context] || {};
        const newVariables = this.variableData[context] || {};
        const variableNames = new Set([...Object.keys(oldVariables), ...Object.keys(newVariables)]);

        variableNames.forEach(variable => {
            const dataNodeName = `${context}.${variable}`;

            if (!newVariables[variable] && oldVariables[variable]) {
                this._deleteDataNode(dataNodeName);
            } else if (newVariables[variable] && !oldVariables[variable]) {
                this._createDataNode(dataNodeName, newVariables[variable].value);
            }
        });
    });

    this._showDeletedDataNodeAlert(this.deletedDnConnections);
  }

  /**
   * Creates a new dataNode.
   * 
   * @private
   * @param {string} dnName - The dataNode name.
   * @param {*} value - The value for the dataNode.
   */
  _createDataNode(dnName, value) {
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
   * Deletes an existing dataNode.
   * 
   * @private
   * @param {string} dnName - The dataNode name.
   */
  _deleteDataNode(dnName) {
    if (datanodesManager.foundDatanode(dnName)) {
      const viewModel = datanodesManager.getDataNodeByName(dnName);
      datanodesManager.deleteTaipyDataNode(viewModel, dnName);
    }
  }

  /**
   * Displays a SweetAlert modal with details of deleted dataNode connections.
   * 
   * @private
   * @param {Set<Object>} deletedDnConnections - Set of deleted dataNode connection objects.
   * Each object in the set has a structure like:
   *    {
   *      dnName: "DataNode1",     // Name of the dataNode
   *      wdList: ["Widget1", "Widget2", "Widget3"] // List of associated widgets
   *    }
   */
  _showDeletedDataNodeAlert(deletedDnConnections) {
    if(deletedDnConnections.size !== 0) {
      let text = "The following dataNode(s) and connection(s) with widget(s) is/are deleted !";
      for(let dnConnection of deletedDnConnections) {
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
   * @private
   * @param {string} dnName - The dataNode name.
   * @param {*} value - The new value for the dataNode.
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
   * Retrieves the current settings for dataNodes managed by the TaipyManager.
   * 
   * @returns {Object} The current settings for dataNodes.
   */
  get dataNodeSettings() {
    return this._dataNodeSettings;
  }
  
  /**
   * Sets the current set of deleted dataNode connections.
   * 
   * @param {Set<Object>} newSet - A set of objects representing the 
   *        deleted dataNode connections. Each object in the set should have 
   *        a specific structure, typically including properties like 
   *        `dnName` (the name of the dataNode) and `wdList` (an array of 
   *        associated widget names).
   */
  set deletedDnConnections(newSet) {
    this._deletedDnConnections = newSet;
  }

  /**
   * Retrieves the current set of deleted dataNode connections.
   * 
   * @return {Set<Object>} The current set of deleted dataNode connection objects.
   */
  get deletedDnConnections() {
    return this._deletedDnConnections;
  }
}

const taipyManager = new TaipyManager();

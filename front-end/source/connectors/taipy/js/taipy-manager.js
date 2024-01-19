class TaipyManager {
  constructor() {
    this.variableData = {};
    this.dataNodeSettings = {
      type: 'to_taipy_plugin',
      iconType: '',
      settings: {
        name: '',
        json_var: '',
      }
    };
  }

  processVariableData() {
    Object.entries(this._getVariableData()).forEach(([context, variables]) => {
      if (context === '__main__') return;
  
      Object.entries(variables).forEach(([variable, data]) => {
        const varName = `${context}.${variable}`;
        this._createNewDataNode(varName, data.value);
      });
    });
  }

  onChange(app, varName, value) {
    const variableData = app.getDataTree();
    const updateDataName = varName;
    const updateDataValue = value;
    const [variable, context] = app.getName(varName);

    Object.entries(variableData).forEach(([context, variables]) => {
      if (context === '__main__') return;
  
      Object.entries(variables).forEach(([variable, data]) => {
        if (data.encoded_name === updateDataName && data.value !== updateDataValue) {
          const dnName = `${context}.${variable}`;
          if (datanodesManager.foundDatanode(dnName)) {
            this._updateDataNode(dnName, updateDataValue);
          }
          return; // Exit function once the matching variable is found and updated
        }
      });
    });
  }

  sendToTaipy(dataNodeName, value) {
    const variableData = this._getVariableData();
    const idSplit = Array.from(dataNodeName.split("."));
    const [context, varName] = idSplit.reduce((acc, curr, idx) => {
        if (idx === 0 || idx === idSplit.length - 1) {
            acc.push(curr);
        } else {
            acc[0] = `${acc[0]}.${curr}`;
        }
        return acc;
    }, []);
    const encodedName = variableData[context][varName].encoded_name;
    const oldValue = variableData[context][varName].value;
    variableData[context][varName].value = value;
    if (oldValue !== value) {
      window.taipyApp.update(encodedName, value);
    }
  }

  _createNewDataNode(dnName, value) {
    const types = datanodesManager.getDataNodePluginTypes();
    const viewModel = null;
    const settings = this._getDataNodeSettings();
    const selectedType = types[settings.type];
    this._setDataNodeSettings(dnName, value);

    // Check if a datanode is already exists
    if (!datanodesManager.foundDatanode(dnName)) {
      datanodesManager.settingsSavedCallback(viewModel, settings, selectedType);
    }
  }

  _updateDataNode(dnName, value) {
    const dnModel = datanodesManager.getDataNodeByName(dnName);
    this._setDataNodeSettings(dnName, value);
    datanodesManager.updateDatanode(dnModel, this._getDataNodeSettings());
  }

  setVariableData(newVariableData) {
    this.variableData = newVariableData;
  }

  _getVariableData() {
    return this.variableData;
  }

  _setDataNodeSettings(varName, value) {
    this.dataNodeSettings.settings = {
      name: varName,
      json_var: value,
    };
  }

  _getDataNodeSettings() {
    return this.dataNodeSettings;
  }
}

const taipyManager = new TaipyManager();

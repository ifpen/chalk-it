class TaipyManager {
  constructor() {
    this.variableData = {};
  }

  processVariableData() {
    Object.entries(this.variableData).forEach(([context, variables]) => {
      if (context === '__main__') return;
  
      Object.entries(variables).forEach(([variable, data]) => {
        const varName = `${context}.${variable}`;
        this._createNewDatanode(varName, data.value);
      });
    });
  }

  _createNewDatanode(varName, value) {
    const types = datanodesManager.getDataNodePluginTypes();
    const viewModel = null;
    const newSettings = {
      type: 'to_taipy_plugin',
      iconType: '',
      settings: {
        name: varName,
        json_var: value,
      },
    };
    const selectedType = types[newSettings.type];

    // Check if a datanode is already exists
    if (!datanodesManager.foundDatanode(newSettings.settings.name)) {
      datanodesManager.settingsSavedCallback(viewModel, newSettings, selectedType);
    }
  }

  setVariableData(newVariableData) {
    this.variableData = newVariableData;
  }

  getVariableData() {
    return this.variableData;
  }
}

const taipyManager = new TaipyManager();

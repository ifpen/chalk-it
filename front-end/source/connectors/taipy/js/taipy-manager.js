class TaipyManager {
	constructor() {
		this.types = datanodesManager.getDataNodePluginTypes();
	}

	processVariable(variableData) {
		for (const context in variableData) {
			if (context == "__main__") {
				continue;
			}

			for (const variable in variableData[context]) {
				const value = variableData[context][variable].value;
				const varName = `${context}.${variable}`;
				this.createNewDatanode(varName, value);
			}
		}
	}

	createNewDatanode(varName, value) {
		const viewModel = null;
		const newSettings = {
			"type": "JSON_var_plugin",
			"iconType": "",
			"settings": {
				"name": varName,
				"json_var": value
			}
		}
		const selectedType = this.types[newSettings.type];

		// Check if a datanode is already exists
		if (!datanodesManager.foundDatanode(newSettings.settings.name)) {
			datanodesManager.settingsSavedCallback(viewModel, newSettings, selectedType);
		}
	}
}

const taipyManager = new TaipyManager();
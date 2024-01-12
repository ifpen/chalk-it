class TaipyManager {
	constructor() {}


	createNewDatanode() {
		const types = datanodesManager.getDataNodePluginTypes();
        const viewModel = null;
        // let newSettings = datanodesManager.getDataNodeNewSettings();
		const newSettings = {
			"type": "JSON_var_plugin",
			"iconType": "",
			"settings": {
				"name": "test",
				"json_var": "4"
			}
		}

        const selectedType = types[newSettings.type];

		if (datanodesManager.foundDatanode(newSettings.settings.name)) return;
        datanodesManager.settingsSavedCallback(viewModel, newSettings, selectedType);
	}
}

const taipyManager = new TaipyManager();


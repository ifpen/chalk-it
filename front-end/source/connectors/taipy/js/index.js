const onInit = (app) => {
    console.log("onAppInit", app.getDataTree());
    const variableData = app.getDataTree();
    taipyManager.setVariableData(variableData);
    taipyManager.setApp(app);
};

const init = () => {
    // Init taipy app
    window.taipyApp = TaipyGuiBase.createApp(onInit);
    window.taipyApp.onChange = taipyManager.onChange.bind(taipyManager);
};

init();

const onInit = (app) => {
    console.log("onAppInit", app.getDataTree());
    const variableData = app.getDataTree();
    taipyManager.setVariableData(variableData);
};


const init = () => {
    // Init taipy app
    window.taipyApp = TaipyGuiBase.createApp(onInit);
    window.taipyApp.onUpdate = taipyManager.onChange;
};

init();

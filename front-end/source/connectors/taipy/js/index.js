const onInit = (app) => {
    console.log("onAppInit", app.getDataTree());
    taipyManager.app = app;
};

const init = () => {
    // Init Taipy app
    window.taipyApp = TaipyGuiBase.createApp(onInit);
    window.taipyApp.onChange = taipyManager.onChange.bind(taipyManager);
};

init();

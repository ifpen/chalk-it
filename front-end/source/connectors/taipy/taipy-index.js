const onInit = (app) => {
  console.log('onAppInit', app.getDataTree());

  // Initialize Taipy manager properties
  taipyManager.app = app;
  taipyManager.currentContext = app.getContext();

  // Check if there are any changes in dataTree
  taipyManager.checkForChanges();
};

const init = () => {
  // Init Taipy app
  window.taipyApp = TaipyGuiBase.createApp(onInit);
  window.taipyApp.onChange = taipyManager.onChange.bind(taipyManager);
};

init();

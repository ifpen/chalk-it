import _ from 'lodash';
import PNotify from 'pnotify';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { runtimeSingletons } from 'kernel/runtime-singletons';
import { chalkit } from 'kernel/general/interfaces/chalkit-api';
import 'shared.taipy-gui-base';
import 'taipy-gui-base';
import TaipyDesignerAdapter from 'designer-adapter';

/**
 * Manages the interaction between Chalk-it and Taipy.
 * It primarily handles the creation, updating, and deletion of dataNodes and sending updated values to Taipy.
 *
 * @class
 */
class TaipyManager {
  #app;
  #taipyDesignerAdapter;
  #runMode;
  #currentContext;
  #xprjsonFileName;
  #variableData;
  #deletedDnConnections;
  #endAction;
  #ignoredVariables;
  #ignoredFunctions;
  #widgetSpinner;
  #taipyCookie;

  /**
   * Constructs a new TaipyManager instance.
   *
   * @constructor
   */
  constructor() {
    this.#app = {};
    this.#taipyDesignerAdapter = {};
    this.#runMode = '';
    this.#currentContext = '';
    this.#xprjsonFileName = '';
    this.#variableData = {};
    this.#deletedDnConnections = new Set();
    this.#endAction = undefined;
    // Variables that will be ignored (do not create a dataNode)
    this.#ignoredVariables = new Set(['chlkt_json_data_', 'chlkt_file_list_', 'TaipyOnInit']);
    // Functions that will be ignored
    this.#ignoredFunctions = new Set([
      'on_change',
      'chlkt_load_file_',
      'chlkt_save_file_',
      'chlkt_get_file_list_',
      'notice',
    ]);
    this.#widgetSpinner = {
      display: false,
      remove: () => {},
      add: () => {},
    };
    this.taipyCookie = {
      name: 'tprh',
      value: '',
    };
  }

  /**
   * Initializes the Taipy application, setting the running mode, and configuring the app instance
   * with necessary event handlers.
   * This setup includes change detection and notification handling to ensure the app's responsive
   * behavior and error management.
   *
   * @method initTaipyApp
   * @public
   * @param {string} runMode - Specifies the running mode of the application, which can be either 'runtime' or 'studio'.
   *                           The 'runtime' mode is typically used for production environments,
   *                           while 'studio' mode is used during development within a dashboard.
   * @returns {void} This method does not return a value.
   */
  initTaipyApp(runMode) {
    try {
      this.#runMode = runMode;
      this.app = TaipyGuiBase.createApp(this.#onInit.bind(this));
      this.app.onChange = this.#onChange.bind(this);
      this.app.onNotify = this.#onNotify.bind(this);
      this.app.onReload = this.#onReload.bind(this);
      this.app.onWsStatusUpdate = this.#onWsStatusUpdate.bind(this);
      this.app.onWsMessage = this.#onWsMessage.bind(this);
      // Init Taipy Designer Adapter
      // Safely check if TaipyDesignerAdapter is defined
      if (typeof TaipyDesignerAdapter !== 'undefined') {
        this.taipyDesignerAdapter = TaipyDesignerAdapter.getDesignerWsAdapter(
          this.app,
          this.#onEditStatusChange.bind(this),
          this.#onEditRequest.bind(this),
          this.#onResetEditRequest.bind(this),
          this.#onPageDataChange.bind(this),
          this.#onUpdatePageDataRequest.bind(this),
          this.#onNavigateRequest.bind(this)
        );
        this.app.registerWsAdapter(this.taipyDesignerAdapter);
      }
    } catch (error) {
      this.#handleError('Failed to initialize Taipy App', error);
    }
  }

  /**
   * Processes variable data, creating or deleting dataNodes based on changes.
   * It updates the variable data if there are changes in the current context.
   *
   * @method processVariableData
   * @public
   * @returns {void} This method does not return a value.
   */
  processVariableData() {
    try {
      const currentContext = this.currentContext;
      if (this.currentContext !== this.app.getContext()) return;
      this.#initFunctionList();
      const dataTree = this.app.getDataTree();
      if (currentContext === '__main__') {
        dataTree[currentContext] = Object.fromEntries(
          Object.entries(dataTree[currentContext]).filter(([key]) => !key.startsWith('gui'))
        );
      }
      const currentVariables = this.#deepClone(this.variableData)[currentContext] || {};
      const newVariables = this.#deepClone(dataTree)[currentContext] || {};

      // Performs a deep comparison
      if (_.isEqual(newVariables, currentVariables)) return;

      // Update variableData
      this.variableData[currentContext] = this.#deepClone(newVariables);
      this.deletedDnConnections.clear();

      // Combine current and new variable names to iterate over
      const variableNames = new Set([...Object.keys(currentVariables), ...Object.keys(newVariables)]);

      // Filter variableNames to exclude ignoredVariables
      this.#ignoredVariables.forEach((ignoredVariable) => variableNames.delete(ignoredVariable));

      variableNames.forEach((variableName) => {
        this.#processDataNode(variableName, newVariables[variableName]);
      });

      this.#showDeletedDataNodeAlert(this.deletedDnConnections);
    } catch (error) {
      this.#handleError('Error processing variable data', error);
    }
  }

  /**
   * Sends updated value to Taipy.
   *
   * @method sendToTaipy
   * @public
   * @param {string} varName - The name of the variable (name of the dataNode).
   * @param {*} newValue - The value to be sent (value of the dataNode).
   * @returns {void} This method does not return a value.
   */
  sendToTaipy(varName, newValue) {
    try {
      const currentContext = this.currentContext;
      if (currentContext !== this.app.getContext()) return;

      const encodedName = this.app.getEncodedName(varName, currentContext);
      const currentValue = this.variableData[currentContext][varName].value;
      // Performs a deep comparison
      if (_.isEqual(currentValue, newValue)) return; // Current simple solution. To be enhanced in the future
      // Send newValue
      this.app.update(encodedName, newValue);
    } catch (error) {
      this.#handleError(`Error sending updated value to Taipy for variable ${varName}`, error);
    }
  }

  /**
   * This function allows to save the file in the base directory which defined in the Taipy page.
   * The data is passed as a JSON string, formatted with tab indentation, to enhance readability.
   *
   * @remarks
   * - If the file doesn't already exist, it will create a new one and store the xprjson data in it.
   *
   * @method saveFile
   * @public
   * @param {Object} xprjson - The object to be saved, which will be converted to a JSON string.
   * @param {string} actionName - The name of the action to be triggered in the taipy page.
   * @returns {void} This method does not return a value.
   */
  saveFile(xprjson, actionName) {
    try {
      const action_name = actionName ?? 'save_file';
      this.app.trigger('chlkt_save_file_', action_name, {
        data: JSON.stringify(xprjson, null, '\t'),
        xprjson_file_name: this.xprjsonFileName,
      });
    } catch (error) {
      this.#handleError('Error saving file', error);
    }
  }

  /**
   * Initiates the loading of a specified file within the application.
   * This method triggers an event, signaling the application to read a file,
   * which facilitates the dynamic loading of content based on the provided file name
   *
   * @method loadFile
   * @public
   * @param {string} fileName - Name of the file to be loaded.
   * @param {boolean} [isTemplateFile=false] -  Specifies whether the file is a template. If true,
   *                                            the file will be loaded from the template directory;
   *                                            otherwise, it will be loaded from the current working directory (cwd).
   *                                            Defaults to false.
   * @returns {void} This method does not return a value.
   */
  loadFile(fileName, isTemplateFile = false) {
    try {
      this.app.trigger('chlkt_load_file_', 'load_file', {
        xprjson_file_name: fileName,
        is_template_file: isTemplateFile,
      });
    } catch (error) {
      this.#handleError('Error loading file', error);
    }
  }

  /**
   * Triggers a request to obtain a chlkt_file_list_ object from the specified base path in Taipy page.
   * The chlkt_file_list_ object includes the base path and a list of file names with the .xprjson extension.
   *
   * @remarks
   * - This method does not return the file list directly; it merely initiates the process of retrieving it.
   * - The event triggered by this method should be handled to process the chlkt_file_list_ object, which will have the following structure:
   *   {
   *     "file_names": ["string - file name with the .xprjson extension", ...]
   *     "base_path": "string - the path to the directory searched",
   *   }
   *
   * @method getFileList
   * @public
   * @returns {void} This method does not return a value.
   */
  getFileList() {
    try {
      this.app.trigger('chlkt_get_file_list_', 'get_file_list');
    } catch (error) {
      this.#handleError('Error getting file list', error);
    }
  }

  /**
   * Trigger an event to execute a Taipy function and submit the loaded file data from a file loader widget.
   *
   * @method functionTrigger
   * @public
   * @param {string} functionName - The name of the Taipy function to be executed.
   * @param {*} fileData - The data of the loaded file.
   * @returns {void} This method does not return a value.
   */
  functionTrigger(functionName, fileData) {
    try {
      this.app.trigger(functionName, 'action_name', { file_data: fileData });
    } catch (error) {
      this.#handleError(`Error triggering function ${functionName}`, error);
    }
  }

  /**
   * Asynchronously uploads one or more selected files to the server by creating a temporary file in a predefined directory,
   * while tracking and logging the upload progress. It executes a callback function upon the successful completion of all file uploads.
   * The directory path is defined in the "upload_folder" variable on the Taipy page.
   *
   * @method uploadFile
   * @public
   * @async
   * @param {Event} event - The event triggered by the file input element, used to get the selected files.
   * @param {string} varFilePath - The variable that will be defined as the file path.
   * @param {Function} callback - A callback function to be called upon successful upload of the file.
   * @param {Function} displaySpinner - A function to control the display of a spinner during the upload process.
   * Accepts a string argument ('add' or 'remove') to show or hide the spinner, respectively.
   * @returns {Promise<void>} A promise that resolves when the upload process is complete. This method does not return any value,
   * but it ensures that the callback is called after the upload completion or the error notification is triggered upon failure.
   */
  async uploadFile(event, varFilePath, callback, displaySpinner) {
    try {
      const files = event.target.files;
      if (!files?.length) return;

      const fileName = event.target.files[0].name;
      const notice = this.#notify('File uploading in progress...', '', 'info', 0, false);
      const encodedVarName = this.app.getEncodedName(varFilePath, this.currentContext);
      displaySpinner('add');
      const printProgressUpload = (progress) => {
        notice.update({
          text: `[${progress.toFixed(1)}% completed]`,
        });
      };
      const result = await this.app.upload(encodedVarName, files, printProgressUpload);
      displaySpinner('remove');
      notice.remove();
      this.#notify('File upload', `${fileName} uploaded successfully!`, 'success', 2000);
      callback();
    } catch (error) {
      displaySpinner('remove');
      console.log('Upload failed', error);
      this.#notify('File upload', error, 'error', 2000);
    }
  }

  /**
   * Checks if the current page is open based on the application's routes.
   * If the page is already open in another tab or if the current page is not found in the routes,
   * it must reload and redirect the user to the origin URL before proceeding.
   *
   * @method #checkIfPageIsOpen
   * @private
   * @returns {void} This method does not return a value.
   */
  #checkIfPageIsOpen() {
    const currentRoutes = this.app.getRoutes();
    let pageName = window.location.pathname.slice(1);

    // If there is no pageName, set it to Taipy special root page name so the route can be verified
    if (pageName === '') {
      pageName = 'TaiPy_root_page';
    }
    // Check if the current routes contain the page name
    const isPageAvailable = currentRoutes?.some((sublist) => sublist[0] === pageName && sublist[1] === 'TaipyDesigner');

    // Page is available, no need to perform any routing
    if (isPageAvailable) {
      return;
    }

    // If the page is not available, redirect to the first origin that is TaipyDesigner type
    const defaultPage = currentRoutes?.find((sublist) => sublist[1] === 'TaipyDesigner');
    if (!isPageAvailable && defaultPage) {
      window.location.href = defaultPage[0];
      return;
    }

    // force reload so taipy-gui will handle the routing
    window.location.reload();
  }

  /**
   * Callback function executed upon initialization of the Taipy app.
   *
   * @method #onInit
   * @private
   * @param {Object} app - The initialized Taipy application instance.
   * @returns {void} This method does not return a value.
   */
  #onInit(app) {
    this.#checkIfPageIsOpen();
    this.#saveTaipyCookie();
    this.currentContext = app.getContext();
    // For design = False, verify if the resource handler is correct
    if (window.rh_id && window.rh_id !== app.getPageMetadata()['rh_id']) {
      window.location.reload();
    }
    this.xprjsonFileName = app.getPageMetadata()['xprjson_file_name'];
    if (this.#runMode == 'runtime') {
      this.processVariableData();
    } else {
      // Studio mode
      try {
        if (typeof this.taipyDesignerAdapter == 'undefined' && this.taipyDesignerAdapter == null) {
          throw new Error('Taipy Designer Adapter is not initialized');
        }
        // Request edit if taipyDesignerAdapter is initialized
        this.taipyDesignerAdapter.requestEdit();
      } catch (error) {
        this.#handleError('Failed to initialize Taipy App', error);
      }
    }
  }

  /**
   * Callback function executed upon reload of the Taipy app.
   *
   * @method #onReload
   * @private
   * @param {Object} app - The Taipy application instance.
   * @param {boolean} removeChanges - A flag indicating whether to remove changes.
   */
  #onReload(app, removeChanges) {
    this.processVariableData();
    if (this.taipyDesignerAdapter && typeof this.taipyDesignerAdapter.getEditStatus === 'function') {
      this.taipyDesignerAdapter.getEditStatus();
    }
  }

  /**
   * Callback function handles changes to variables within the application.
   *
   * @method #onChange
   * @private
   * @param {Object} app - The application instance.
   * @param {string} encodedName - The encoded name of the variable.
   * @param {*} newValue - The new value of the variable.
   * @returns {void} This method does not return a value.
   */
  #onChange(app, encodedName, newValue) {
    try {
      const [varName, context] = app.getName(encodedName);
      if (this.currentContext !== context) return;

      if (this.variableData[context] && Object.keys(this.variableData[context]).length !== 0) {
        // Update variableData
        this.variableData[context][varName].value = this.#deepClone(newValue);
      }

      // loadFile
      if (encodedName.includes('chlkt_json_data_')) {
        if (_.isFunction(this.endAction)) {
          // For load file
          // The endAction callback corresponds to "_openTaipyPageEndAction"
          this.endAction(newValue); // newValue contains xprjson data
          this.endAction = undefined;
        } else {
          // For save file
          try {
            if (typeof this.taipyDesignerAdapter == 'undefined' && this.taipyDesignerAdapter == null) {
              throw new Error('Taipy Designer Adapter is not initialized');
            }
            // Update open page in other tabs or browsers.
            this.taipyDesignerAdapter.requestUpdatePageData(newValue);
          } catch (error) {
            this.#handleError('Error updating page', error);
          }
        }
      }

      // getFileList
      if (encodedName.includes('chlkt_file_list_')) {
        if (_.isFunction(this.endAction)) {
          const fileList = JSON.parse(newValue);
          this.endAction(fileList);
          this.endAction = undefined;
        }
      }

      if (!datanodesManager.foundDatanode(varName)) return;
      this.#updateDataNode(varName, newValue);
    } catch (error) {
      this.#handleError(`Error handling change for variable ${encodedName}`, error);
    }
  }

  /**
   * Handles notification messages related to application events. This method reacts differently
   * based on the type of message received and the specified action within the message. It supports
   * handling specific actions such as loading and saving files, with distinct behaviors for info
   * and error message types.
   *
   * @method #onNotify
   * @private
   * @param {Object} app - The application instance.
   * @param {string} type - The type of message received, expected to be one of the predefined MESSAGE_TYPES.
   * @param {string} message - The message content. It includes:
   *      - {string} action_name: The specific action that the notification is about,
   *                              expected to be one of the predefined ACTIONS ('load_file', 'save_file').
   *      - {string} text: A descriptive message or information about the action being notified.
   *      - {boolean} [is_new_file]: Optional. Specifies whether the file involved in the notification is new.
   * @returns {void} This method does not return a value.
   */
  #onNotify(app, type, message) {
    const MESSAGE_TYPES = { INFO: 'I', ERROR: 'E', SUCCESS: 'S', WARNING: 'W' };
    const ACTIONS = { LOAD_FILE: 'load_file', SAVE_FILE: 'save_file', NOTICE: 'notice' };
    switch (message.action_name) {
      case ACTIONS.LOAD_FILE: {
        if (type == MESSAGE_TYPES.INFO) {
          // This case is handled in the #onChange function
        } else if (type == MESSAGE_TYPES.ERROR) {
          this.#notify('Info project', message.text, 'error', 2000);
        }
        break;
      }
      case ACTIONS.SAVE_FILE: {
        if (type == MESSAGE_TYPES.INFO) {
          if (_.isFunction(this.endAction)) {
            /**
             * If the project is "open" from the dashboard and you wish to save the current project :
             *    The endAction callback corresponds to "openTaipyPage" => "commonActions".
             *    The "commonActions" callback will call "loadFile" and "_openTaipyPageEndAction".
             *    PS: ! Do not assign an indefinite value: used in the Open function
             *
             * Otherwise:
             *    The "endAction" callback is used only to remove the dirty flag (and display notice).
             */
            this.endAction(); // Not yet assigned
          }
          const $rootScope = this.#getRootScope();
          if (!$rootScope.autoSave) {
            this.#notify('Info project', message.text, 'success', 2000);
          }
          datanodesManager.showLoadingIndicator(false);
          $rootScope.updateFlagDirty(false);
          $rootScope.$apply();
        } else if (type == MESSAGE_TYPES.ERROR) {
          datanodesManager.showLoadingIndicator(false);
          this.#notify('Info project', message.text, 'error', 2000);
        }
        break;
      }
      case ACTIONS.NOTICE: {
        if (message.blocking) {
          this.#swalNotify(message.title, message.text, type);
        } else {
          this.#userNotify(message.title, message.text, type);
        }
        break;
      }
      default: {
        this.#notify('', message, type, 3000);
      }
    }
  }

  /**
   * Handles the status change of the edit mode.
   *
   * @method #onEditStatusChange
   * @private
   * @param {Object} app - The Taipy application instance.
   * @param {boolean} editable - Indicates if the application is in editable mode.
   */
  #onEditStatusChange(app, editable) {
    // Check if the 'tprh' cookie exists, and reload the page if it does not
    if (!this.checkCookie('tprh')) {
      window.location.reload();
    }

    const $rootScope = this.#getRootScope();
    $rootScope.isEditableDash = editable;
    $rootScope.$apply();
    if (!editable) {
      swal({
        title: 'This page is currently being edited in another browser tab',
        text: 'Please use the already open tab to avoid edition inconsistencies',
        icon: 'error',
        button: 'OK',
      });
    }
  }

  /**
   * Handles edit requests and performs actions based on the success or failure of the request.
   *
   * @method #onEditRequest
   * @private
   * @param {Object} app - The Taipy application instance.
   * @param {boolean} success - Indicates if the edit request was successful.
   * @param {string} message - The message indicating the result of the edit request.
   */
  #onEditRequest(app, success, message) {
    const openProjectCallback = () => {
      if (_.isFunction(this.endAction)) {
        // To load the xprjsonFileName if it exists
        this.endAction();
      }
    };
    if (success) {
      openProjectCallback();
    } else {
      const swalCallback = (title, text) =>
        swal({
          title,
          text,
          icon: 'error',
          button: 'OK',
        });
      switch (message) {
        case 'page_not_found':
          swalCallback('Internal Error', 'Page not found!');
          break;
        case 'app_instance_id_not_found':
          swalCallback('Internal Error', 'App instance ID not found!');
          break;
        case 'page_occupied': {
          const $rootScope = this.#getRootScope();
          $rootScope.isEditableDash = false;
          swalCallback(
            'This page is currently being edited in another browser tab',
            'Please use the already open tab to avoid edition inconsistencies'
          );
          openProjectCallback();
          break;
        }
      }
    }
  }

  /**
   * Handles reset edit requests and performs actions based on the success or failure of the request.
   *
   * @method #onResetEditRequest
   * @private
   * @param {Object} app - The Taipy application instance.
   * @param {boolean} success - Indicates if the reset edit request was successful.
   * @param {string} message - The message indicating the result of the reset edit request.
   */
  #onResetEditRequest(app, success, message) {
    if (success) {
      // TODO
    } else {
      const swalCallback = (title, text) =>
        swal({
          title,
          text,
          icon: 'error',
          button: 'OK',
        });
      switch (message) {
        case 'page_not_found':
          swalCallback('Internal Error', 'Page not found!');
          break;
        case 'app_instance_id_not_found':
          swalCallback('Internal Error', 'App instance ID not found!');
          break;
        case 'not_authorized':
          swalCallback('Access Denied', 'Not authorized to reset page edit');
          break;
      }
    }
  }

  /**
   * Handles page data changes and updates the application state accordingly.
   *
   * @method #onPageDataChange
   * @private
   * @param {Object} app - The Taipy application instance.
   * @param {boolean} editable - Indicates if the page data is editable.
   * @param {string} pageData - The JSON string representing the page data.
   */
  #onPageDataChange(app, editable, pageData) {
    if (!editable) {
      angular
        .element(document.body)
        .injector()
        .invoke([
          'ManagePrjService',
          (ManagePrjService) => {
            ManagePrjService.clearForNewProject();
          },
        ]);
      const jsonObject = JSON.parse(pageData);
      runtimeSingletons.xdash.deserialize(jsonObject);
      this.processVariableData();
    }
  }

  /**
   * Handles update page data requests and performs actions based on the success or failure of the request.
   *
   * @method #onUpdatePageDataRequest
   * @private
   * @param {Object} app - The Taipy application instance.
   * @param {boolean} success - Indicates if the update page data request was successful.
   * @param {string} message - The message indicating the result of the update page data request.
   */
  #onUpdatePageDataRequest(app, success, message) {
    if (success) {
      // TODO
    } else {
      const swalCallback = (title, text) =>
        swal({
          title,
          text,
          icon: 'error',
          button: 'OK',
        });
      switch (message) {
        case 'page_not_found':
          swalCallback('Internal Error', 'Page not found!');
          break;
        case 'app_instance_id_not_found':
          swalCallback('Internal Error', 'App instance ID not found!');
          break;
      }
    }
  }

  /**
   * Handles navigation to a page.
   *
   * @method onNavigateRequest
   * @private
   * @param {Object} app - The Taipy application instance.
   * @param {string} to - The name of the page to navigate to.
   *                      This can be a page identifier (as created by `Gui.add_page()^` with no leading '/') or an URL.
   *                      If omitted, the application navigates to the root page.
   * @param {Object} params - A dictionary of query parameters.
   * @param {string} tab - When navigating to a page that is not a known page, the page is opened in a tab identified by
   *                       **tab** (as in [window.open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)).<br/>
   *                       The default value creates a new tab for the page (which is equivalent to setting *tab* to "_blank").
   * @param {boolean} force - When navigating to a known page, the content is refreshed even it the page is already shown.
   * @returns {void} This method does not return a value.
   */
  #onNavigateRequest(app, to, params, tab, force) {
    if (!to || typeof to !== 'string') {
      return;
    }

    // Check if the given input is a full URL
    const isFullUrl = (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    // Construct a full URL from the base URL and the input path
    const constructFullUrl = (baseUrl, path) => `${baseUrl}/${path.replace(/^\//, '')}`;

    // Construct query string from params
    const constructQueryString = (params) =>
      Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    const currentRoutes = this.app.getRoutes();
    const queryString = constructQueryString(params);
    const baseUrl = window.location.origin;
    let isPageAvailable = false;
    let url = '';

    if (isFullUrl(to)) {
      url = to;
    } else if (to === '/') {
      url = baseUrl;
      isPageAvailable = true;
    } else {
      url = constructFullUrl(baseUrl, to);
      // Check if the current routes contain the page name
      isPageAvailable = currentRoutes?.some((sublist) => sublist[0] === to);
    }

    if (queryString) {
      url += `?${queryString}`;
    }

    if (isPageAvailable) {
      window.location.href = url;
    } else {
      window.open(url, tab || '_blank')?.focus();
    }
  }

  /**
   * Handles the WebSocket status updates and manages the display of a spinner widget.
   *
   * @method #onWsStatusUpdate
   * @private
   * @param {Object} app - The Taipy application instance.
   * @param {string} messageQueue - The queue of messages received via WebSocket.
   * @returns {void} This method does not return a value.
   */
  #onWsStatusUpdate(app, messageQueue) {
    if (this.widgetSpinner?.display) {
      if (messageQueue.length) {
        this.widgetSpinner.add();
      } else {
        this.widgetSpinner.remove();
        this.widgetSpinner = {
          display: false,
          add: () => {},
          remove: () => {},
        };
      }
    }
  }

  /**
   * Handles WebSocket events : connect, reconnect, connect_error, disconnect.
   *
   * @method #onWsMessage
   * @private
   * @param {Object} app - The Taipy application instance.
   * @param {string} event - The WebSocket event type.
   * @param {Object} payload - The payload of the WebSocket event.
   * @param {Object} [payload.err] - The error object, if any (only for 'connect_error' event).
   * @param {string} [payload.reason] - The reason for disconnection (only for 'disconnect' event).
   * @param {Object} [payload.details] - Additional details for disconnection (only for 'disconnect'
   * @returns {void} This method does not return a value.
   */
  #onWsMessage(app, event, payload) {
    const $rootScope = this.#getRootScope();
    if (!$rootScope) return;

    switch (event) {
      case 'connect': {
        // console.info('WebSocket connected');
        $rootScope.websocketConnected = true;
        break;
      }
      case 'reconnect': {
        // console.info('WebSocket reconnected');
        $rootScope.websocketConnected = true;
        break;
      }
      case 'connect_error': {
        const { err } = payload;
        // this.#handleError('Error connecting WebSocket', err);
        $rootScope.websocketConnected = false;
        break;
      }
      case 'disconnect': {
        const { reason, details } = payload;
        // console.info('WebSocket disconnected due to: ', reason, details);
        $rootScope.websocketConnected = false;
        break;
      }
    }
    $rootScope.$apply();
  }

  /**
   * Initializes the list of available functions by creating corresponding dataNodes for each, excluding specific file management functions.
   *
   * This method iterates through the list of function names retrieved from the application,
   * and for each function name that is not in the set of excluded file management functions
   *
   * @method #initFunctionList
   * @private
   * @returns {void} This method does not return a value.
   */
  #initFunctionList() {
    const functionList = this.app.getFunctionList();
    functionList.forEach((funcName) => {
      if (!this.#ignoredFunctions.has(funcName)) {
        const dnName = funcName;
        if (!datanodesManager.foundDatanode(dnName)) {
          this.#createDataNode(dnName, funcName, { isFunction: true });
        }
      }
    });
  }

  /**
   * Processes a Taipy variable by managing its corresponding data node. It either creates a new data node if one does not exist
   * for the given Taipy variable or deletes the data node if the Taipy variable is undefined.
   *
   * @method #processDataNode
   * @private
   * @param {string} varName - The name of the Taipy variable to process.
   * @param {*} variable - The value of the Taipy variable. If undefined, indicates that the variable is deleted.
   * @returns {void} This method does not return a value.
   */
  #processDataNode(varName, variable) {
    if (!datanodesManager.foundDatanode(varName)) {
      // Create the dataNode corresponding to the Taipy variable, if it doesn't already exist.
      const value = variable.value;
      this.#createDataNode(varName, value);
    } else if (variable === undefined) {
      // If the Taipy variable is deleted, the corresponding dataNode will be deleted.
      this.#deleteDataNode(varName);
    }
  }

  /**
   * Creates a new dataNode.
   *
   * @method #createDataNode
   * @private
   * @param {string} dnName - The dataNode name.
   * @param {*} value - The value of the dataNode.
   * @param {Object} newProp - The new dataNode settings property.
   * @returns {void} This method does not return a value.
   */
  #createDataNode(dnName, value, newProp) {
    const types = datanodesManager.getDataNodePluginTypes();
    const viewModel = null;
    const dnSettings = {
      type: 'taipy_link_plugin',
      iconType: '',
      settings: {
        name: dnName,
        json_var: JSON.stringify(value),
      },
    };
    dnSettings.settings = { ...dnSettings.settings, ...(newProp ?? {}) };
    const selectedType = types[dnSettings.type];
    datanodesManager.settingsSavedCallback(viewModel, dnSettings, selectedType);
  }

  /**
   * Updates an existing dataNode.
   *
   * @method #updateDataNode
   * @private
   * @param {string} dnName - The dataNode name.
   * @param {*} value - The new value of the dataNode.
   * @returns {void} This method does not return a value.
   */
  #updateDataNode(dnName, value) {
    const dnModel = datanodesManager.getDataNodeByName(dnName);
    const dnSettings = {
      type: 'taipy_link_plugin',
      iconType: '',
      settings: {
        name: dnName,
        json_var: JSON.stringify(value),
      },
    };
    datanodesManager.updateDatanode(dnModel, dnSettings);
  }

  /**
   * Deletes an existing dataNode.
   *
   * @method #deleteDataNode
   * @private
   * @param {string} dnName - The dataNode name.
   * @returns {void} This method does not return a value.
   */
  #deleteDataNode(dnName) {
    const viewModel = datanodesManager.getDataNodeByName(dnName);
    datanodesManager.deleteTaipyDataNode(viewModel, dnName);
  }

  /**
   * Displays a SweetAlert modal with details of deleted dataNode connections.
   *
   * @method #showDeletedDataNodeAlert
   * @private
   * @param {Set<Object>} deletedDnConnections - Set of deleted dataNode connection objects.
   * @returns {void} This method does not return a value.
   */
  #showDeletedDataNodeAlert(deletedDnConnections) {
    if (deletedDnConnections.size !== 0) {
      let text = 'The following variable(s) and connection(s) with widget(s) is/are deleted !';
      for (const dnConnection of deletedDnConnections) {
        text += `<br><br>- "${dnConnection.dnName}":<br>${dnConnection.wdList.join('<br>')}`;
      }
      const content = `<div style="max-height: 150px; overflow-y: auto;">${text}</div>`;
      swal({
        title: 'Deleted variable(s)',
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
   * Creates a deep clone of the object if the input is a non-null object. If the object contains functions,
   * their references are copied. Returns the input value for non-object types.
   *
   * This function uses Lodash's _.cloneDeep, which handles complex objects including nested structures,
   * circular references, and maintains function references.
   *
   * @method #deepClone
   * @private
   * @param {*} value - The value to check and deeply clone.
   * @returns {*} Deep clone of the input object, or the original value.
   */
  #deepClone(value) {
    return value !== null && typeof value === 'object' ? _.cloneDeep(value) : value;
  }

  /**
   * Handles errors by displaying an alert to the user and logging the error to the console.
   *
   * @method #handleError
   * @private
   * @param {string} message - The user-friendly error message to display in the alert.
   * @param {Error} error - The error object with details about the error. This is logged to the console.
   * @returns {void} This method does not return a value.
   */
  #handleError(message, error) {
    swal('Please check and reload the page', message, 'error');
    console.error(`${message}:`, error);
  }

  /**
   * Displays a notification using PNotify with the specified title, text, type, and delay.
   * This method allows for automatic closing of the notification after a specified delay
   * and gives users the option to manually close the notification by clicking on it.
   *
   * @method #notify
   * @private
   * @param {string} title - The title of the notification to be displayed.
   * @param {string} text - The text content of the notification.
   * @param {string} type - The type of the notification, which determines the notification's styling.
   * @param {number} delay - The delay in milliseconds before the notification automatically closes.
   * @param {boolean} [hide=true] - Optional. Determines if the notification should be automatically hidden after the delay.
   * If set to false, the notification remains visible until manually closed by the user.
   * @returns {PNotify} Returns the PNotify instance created for the notification.
   */
  #notify(title, text, type, delay, hide = true) {
    const notice = new PNotify({ title, text, type, delay, hide, styling: 'bootstrap3' });
    $('.ui-pnotify-container').on('click', () => notice.remove());
    return notice;
  }

  /**
   * Sends a notification using the Chalkit notification system.
   *
   * @method #userNotify
   * @private
   * @param {string} varName - The variable name associated with the notification.
   * @param {string} text - The text content of the notification.
   * @param {string} type - The type of the notification (e.g., 'success', 'error', 'info', 'warning').
   * @returns {PNotify} Returns the PNotify instance created for the notification.
   */
  #userNotify(varName, text, type) {
    return chalkit.notification.notify(varName, text, type);
  }

  /**
   * Sends a notification using the Swal (SweetAlert) notification system.
   *
   * @method #swalNotify
   * @private
   * @param {string} title - The title of the SweetAlert notification.
   * @param {string} text - The text content of the SweetAlert notification.
   * @param {string} type - The type of the SweetAlert notification (e.g., 'success', 'error', 'info', 'warning')..
   * @returns {Swal} Returns the swal instance created for the notification.
   */
  #swalNotify(title, text, type) {
    return chalkit.notification.swalert(title, text, type);
  }

  /**
   * Retrieves the current root scope of the Angular application.
   *
   * @method #getRootScope
   * @private
   * @returns {angular.IScope|null} The current rootScope instance or null if it can't be found.
   */
  #getRootScope() {
    return angular.element(document.body).scope()?.$root || {};
  }

  /**
   * Checks if a specific cookie is available in the current document.
   *
   * @method checkCookie
   * @public
   * @param {string} cookieName - The name of the cookie to check for.
   * @returns {boolean} - Returns `true` if the cookie is found, otherwise `false`.
   */
  checkCookie(cookieName) {
    // Get all cookies as a string
    const allCookies = document.cookie;
    if (!allCookies) {
      return false;
    }
    const cookiesArray = allCookies.split(';');
    return cookiesArray.some((cookie) => {
      // Trim any leading whitespace and split the cookie into name and value
      const [name, value] = cookie.trim().split('=');
      // Check if the cookie name matches the one we're looking for
      return name === cookieName;
    });
  }

  /**
   * This method retrieves the value of the "tprh" cookie and saves it to the `taipyCookie` property of the instance.
   *
   * @method #saveTaipyCookie
   * @private
   * @returns {void} This method does not return a value.
   */
  #saveTaipyCookie() {
    // Find the value of the "tprh" cookie
    this.taipyCookie.value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${this.taipyCookie.name}=`))
      .split('=')[1];
  }

  /**
   * Retrieves the current application instance being managed by the TaipyManager.
   *
   * @method app
   * @public
   * @returns {Object} The current application instance.
   */
  get app() {
    return this.#app;
  }

  /**
   * Sets the application instance. This updates the internal reference to the application.
   *
   * @method app
   * @public
   * @param {Object} newApp - The new application instance to be set.
   * @returns {void} This method does not return a value.
   */
  set app(newApp) {
    this.#app = newApp;
  }

  /**
   * Retrieves the current taipy designer adapter instance.
   *
   * @method taipyDesignerAdapter
   * @public
   * @returns {Object} The current taipy designer adapter instance.
   */
  get taipyDesignerAdapter() {
    return this.#taipyDesignerAdapter;
  }

  /**
   * Sets the taipy designer adapter instance.
   *
   * @method newTaipyDesignerAdapter
   * @public
   * @param {Object} newTaipyDesignerAdapter - The new taipy designer adapter instance to be set.
   * @returns {void} This method does not return a value.
   */
  set taipyDesignerAdapter(newTaipyDesignerAdapter) {
    this.#taipyDesignerAdapter = newTaipyDesignerAdapter;
  }

  /**
   * Retrieves the current context from the application instance.
   *
   * @method currentContext
   * @public
   * @returns {string} The current context.
   */
  get currentContext() {
    return this.#currentContext;
  }

  /**
   * Sets the new context for the application instance.
   *
   * @method currentContext
   * @public
   * @param {string} newContext - The new context to set.
   * @returns {void} This method does not return a value.
   */
  set currentContext(newContext) {
    this.#currentContext = newContext;
  }

  /**
   * Retrieves the file name from the application instance.
   *
   * @method xprjsonFileName
   * @public
   * @returns {string} The current file name.
   */
  get xprjsonFileName() {
    return this.#xprjsonFileName;
  }

  /**
   * Sets the new file name for the current project within the application instance.
   * This setter updates the project's name in the `$rootScope` if a current project is defined.
   *
   * @method xprjsonFileName
   * @public
   * @param {string} newFileName - The new file name to be set for the current project, including the ".xprjson" extension.
   * @returns {void} This method does not return a value.
   */
  set xprjsonFileName(newFileName) {
    const $rootScope = this.#getRootScope();
    if ($rootScope.currentProject) {
      const projectName = newFileName.replace(/\\/g, '/').split('/').pop().replace('.xprjson', '');
      $rootScope.currentProject.name = projectName;
    }
    this.#xprjsonFileName = newFileName;
  }

  /**
   * Retrieves the current taipy cookie.
   *
   * @method taipyCookie
   * @public
   * @returns {Object} The current taipy cookie.
   */
  get taipyCookie() {
    return this.#taipyCookie;
  }

  /**
   * Sets new taipy cookie, updating the internal state.
   *
   * @method taipyCookie
   * @public
   * @param {Object} newTaipyCookie - The new taipy cookie.
   * @returns {void} This method does not return a value.
   */
  set taipyCookie(newTaipyCookie) {
    this.#taipyCookie = newTaipyCookie;
  }

  /**
   * Retrieves the current variable data.
   *
   * @method variableData
   * @public
   * @returns {Object} The current variable data.
   */
  get variableData() {
    return this.#variableData;
  }

  /**
   * Sets new variable data, updating the internal state.
   *
   * @method variableData
   * @public
   * @param {Object} newVariableData - The new variable data.
   * @returns {void} This method does not return a value.
   */
  set variableData(newVariableData) {
    this.#variableData = newVariableData;
  }

  /**
   * Retrieves the current set of deleted dataNode connections.
   *
   * @method deletedDnConnections
   * @public
   * @returns {Set<Object>} The current set of deleted dataNode connection objects.
   */
  get deletedDnConnections() {
    return this.#deletedDnConnections;
  }

  /**
   * Sets the current set of deleted dataNode connections.
   *
   * @method deletedDnConnections
   * @public
   * @param {Set<Object>} newSet - A Set of objects representing deleted dataNode connections.
   * Each object should have properties:
   * - `dnName` (string): The name of the dataNode.
   * - `wdList` (Array<string>): An array of associated widget names.
   * @returns {void} This method does not return a value.
   */
  set deletedDnConnections(newSet) {
    this.#deletedDnConnections = newSet;
  }

  /**
   * Retrieves the current widgetSpinner instance.
   *
   * @method widgetSpinner
   * @public
   * @returns {Object} The current endAction function.
   */
  get widgetSpinner() {
    return this.#widgetSpinner;
  }

  /**
   * Updates the widgetSpinner instance.
   *
   * @method widgetSpinner
   * @public
   * @param {Object} newWidgetSpinner - The new widgetSpinner instance to be set.
   * @returns {void} This method does not return a value.
   */
  set widgetSpinner(newWidgetSpinner) {
    this.#widgetSpinner = newWidgetSpinner;
  }

  /**
   * Gets the end action function.
   *
   * @method endAction
   * @public
   * @returns {Function} The current endAction function.
   */
  get endAction() {
    return this.#endAction;
  }

  /**
   * Sets a new end action function.
   *
   * @method endAction
   * @public
   * @param {Function} newEndAction - The new endAction function to be set.
   * @return {void} This method does not return a value.
   */
  set endAction(newEndAction) {
    if (typeof newEndAction === 'function' || newEndAction === undefined) {
      this.#endAction = newEndAction;
    } else {
      throw new Error('newEndAction must be a function or undefined');
    }
  }
}

export const taipyManager = new TaipyManager();

class PythonPluginExecBase {
  static ABORT_ERROR = 'ABORT';
  static DISCONNECTED_ERROR = 'DISCONNECTED';
  static SIGNATURE_ERROR = 'SIGNATURE INVALID';

  static isEmbedded() {
    const injector = angular.element(document.body).injector();
    if (injector?.has('$rootScope')) {
      return injector.invoke(['$rootScope', ($rootScope) => !$rootScope.UserProfile]);
    }
    return true;
  }

  constructor() {}

  getXHR() {
    return null;
  }

  async signCode(code) {
    return undefined;
  }

  async execute(script, dataNodes, debug = false, signature = undefined) {}

  dispose() {}
}

class PythonPluginLocalExec extends PythonPluginExecBase {
  static PSEUDO_IMAGE_NAME = 'Pyodide';
  static PSEUDO_IMAGE_ID = '__PYODIDE__';

  static isSupported() {
    return !!xDashConfig['pyodide']?.pyodide_index;
  }

  static shift(script) {
    return (
      script
        .split(/\r?\n/)
        .map((l) => '  ' + l)
        .join('\n') + '\n'
    );
  }

  static writePython(script, debug) {
    return `
from chalkit_python_api.outputs import capture 

@capture(is_debug=${debug ? 'True' : 'False'}, script_name='<exec>', start_line=5)
def script(dataNodes, chalkit):
${PythonPluginLocalExec.shift(script)}

script(dataNodes)
`;
  }

  async execute(script, dataNodes, debug = false, signature = undefined) {
    const wrappedScript = PythonPluginLocalExec.writePython(script, debug);
    return await pyodideManager.runPythonAsync(wrappedScript, { dataNodes });
  }
}

class PythonPluginRemoteExec extends PythonPluginExecBase {
  static DEFAULT_IMAGE_NAME = 'Default';
  static DEFAULT_IMAGE_ID = '';

  static isSupported() {
    return !_.isUndefined(urlPython);
  }

  static async getImages() {
    const images = await angular
      .element(document.body)
      .injector()
      .invoke([
        'PythonImagesManager',
        '$rootScope',
        (PythonImagesManager, $rootScope) => {
          if (!$rootScope.UserProfile) {
            $rootScope.UserProfile = {};
          }
          if (!$rootScope.UserProfile.userId) {
            $rootScope.UserProfile.userId = prompt('Please fill your User ID');
          }
          return PythonImagesManager.getImages();
        },
      ]);
    return images.map((i) => ({ id: i.Id, name: i.Name, hash: i.Hash }));
  }

  static createId(useHex = true) {
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    let str = '';
    for (let i = 0; i < array.length; i++) {
      str += (i < 2 || i > 5 ? '' : '-') + array[i].toString(useHex ? 16 : 36).slice(-4);
    }
    return str;
  }

  constructor(imageId, clientId = undefined) {
    super();
    this.imageId = imageId;
    this.clientId = clientId ?? PythonPluginRemoteExec.createId();
    this.started = false;
    this.jqXHR = null;
  }

  getXHR() {
    return this.jqXHR;
  }

  async execute(script, dataNodes, debug = false, signature = undefined) {
    if (!signature) {
      signature = await this.signCode(script);
    }

    this.abort();
    return new Promise((resolve, reject) =>
      this.#sendExecRequest(resolve, reject, script, dataNodes, debug, signature)
    );
  }

  #sendExecRequest(resolve, reject, script, dataNodes, debug, signature) {
    const url = urlPython + 'eval';
    const body = {
      callerId: this.clientId,
      image: this.imageId,

      script,
      dataNodes: JSON.stringify(dataNodes), // TODO meh
      isDebug: debug,
      signature,
    };

    let interval = undefined;
    let networkFail = false;
    this.jqXHR = $.ajax({
      url,
      dataType: 'text',
      type: 'POST',
      beforeSend: function (xhr) {
        xhr.setRequestHeader('X-Request-ID', PythonPluginRemoteExec.createId());
      },
      data: JSON.stringify(body),
      responseType: 'json',
      contentType: 'application/json',

      success: (data, status, xhr) => {
        const json = JSON.parseMore(data);
        resolve(json);
      },
      error: (xhr, status, err) => {
        if (networkFail) {
          reject(PythonPluginExecBase.DISCONNECTED_ERROR);
        } else if (xhr.status === 403) {
          reject(PythonPluginExecBase.SIGNATURE_ERROR);
        } else if (status === 'abort') {
          reject(PythonPluginExecBase.ABORT_ERROR);
        } else {
          const statusText = 'Response status ' + xhr.status + ' :' + xhr.statusText;
          let notifText = statusText;
          const errorMsg = xhr.responseJSON;
          if (!_.isUndefined(errorMsg) && !_.isUndefined(errorMsg.errorMessage)) {
            notifText = notifText + '.  ' + errorMsg.errorMessage;
          }

          const error = new Error(statusText);
          error.notifText = notifText;
          reject(error);
        }
      },
      complete: (xhr, status) => {
        this.jqXHR = undefined;
        clearInterval(interval);
      },
    });

    //AEF: network check for every 1 second
    interval = setInterval(() => {
      const isOnLine = navigator.onLine;
      if (!isOnLine) {
        networkFail = true;
        this.abort();
      }
    }, 1000);
  }

  async signCode(code) {
    return await angular
      .element(document.body)
      .injector()
      .invoke([
        '$http',
        '$q',
        async ($http, $q) => {
          this.abort();

          const canceler = $q.defer();
          this.jqXHR = { abort: () => canceler.resolve() };

          const url = urlPython + 'images/sign';
          const result = await $http.post(url, JSON.stringify({ image: this.imageId, code }), {
            contentType: 'application/json; charset=utf-8',
            headers: {
              ...getAuthorizationHeaders(),
              'X-Request-ID': PythonPluginRemoteExec.createId(),
            },
            timeout: canceler.promise,
          });

          this.jqXHR = undefined;

          return result.data;
        },
      ]);
  }

  abort() {
    if (this.jqXHR) {
      this.jqXHR.abort();
      this.jqXHR = null;
    }
  }

  dispose() {
    this.abort();

    if (this.started) {
      const url = urlPython + 'end';
      jqXHR = $.ajax({
        url: url,
        type: 'POST',
        headers: { 'X-Request-ID': PythonPluginRemoteExec.createId() },
        data: JSON.stringify({ callerId: this.clientId }),
        contentType: 'application/json',
        error: (xhr, status, err) => {
          this.jqXHR = undefined;
          const text = 'Error stopping the interpreter. Status: ' + status + ', Error:' + err;
          notificationCallback('error', currentSettings.name, text);
        },
      });
    }
  }
}

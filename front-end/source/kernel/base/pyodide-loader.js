'use strict';

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ pyodideManager                                                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR, Mongi BEN GAID                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import PNotify from 'pnotify';
import { xDashConfig } from 'config.js';

import PyodideWorker from './pyodide-worker.js';

// TODO decide on handling of notifications
// TODO decide on UI block ?

const WORKER_URL = 'pyodide-worker-dev.js';

function notifyInfo(title, text = '') {
  console.log(`${title}${text !== '' ? ':\n' + text : ''}`);

  const notice = new PNotify({ title, text, type: 'info', styling: 'bootstrap3' });
  $('.ui-pnotify-container').on('click', () => notice.remove());
  return notice;
}

function notifyError(text, error) {
  console.error(text, error);

  let msg = error;
  if (typeof msg !== 'string') {
    if (typeof msg.error === 'string') {
      msg = msg.error;
    } else if (typeof msg.message === 'string') {
      msg = msg.message;
    }
  }
  const notice = new PNotify({ title: 'Pyodide error', text: `${text}\n${msg}`, type: 'error', styling: 'bootstrap3' });
  $('.ui-pnotify-container').on('click', () => notice.remove());
}

export class PyodideManager {
  static PYODIDE_STATE_NONE = 'NONE';
  static PYODIDE_STATE_LOADING = 'LOADING';
  static PYODIDE_STATE_READY = 'READY';
  static PYODIDE_STATE_ERROR = 'ERROR';

  constructor() {
    this._listeners = [];
    this.msgIdIterator = 0;
    this.reset(true, false);
  }

  _getDefaultLibs() {
    return {
      standard: JSON.parse(xDashConfig['pyodide'].standard_pyodide_packages || '[]'),
      micropip: JSON.parse(xDashConfig['pyodide'].micropip_pyodide_packages || '[]'),
    };
  }

  reset(clearPackages = true) {
    if (this.pyodideWorker) {
      this.pyodideWorker.terminate();
      this.pyodideWorker = null;
    }
    this.callbacks = null;
    this.pyodideState = PyodideManager.PYODIDE_STATE_NONE;

    if (clearPackages) {
      // Desired packages
      const { standard, micropip } = this._getDefaultLibs();
      this._packages = {
        standard: new Set(standard),
        micropip: new Set(micropip),
      };
    }

    // Currently loaded packages
    this._loadedPackages = {
      standard: new Set(),
      micropip: new Set(),
    };

    this._notifyChanges();
  }

  addPackages(newPackages) {
    newPackages.standard.forEach((_) => this._packages.standard.add(_));
    newPackages.micropip.forEach((_) => this._packages.micropip.add(_));

    this._notifyChanges();
  }

  set packages(packages) {
    this._packages = {
      standard: new Set(packages.standard),
      micropip: new Set(packages.micropip),
    };

    this._notifyChanges();
  }

  get packages() {
    return {
      standard: new Set(this._packages.standard),
      micropip: new Set(this._packages.micropip),
    };
  }

  get loadedPackages() {
    return {
      standard: new Set(this._loadedPackages.standard),
      micropip: new Set(this._loadedPackages.micropip),
    };
  }

  async _loadPackages() {
    const missingStandardPackages = [...this._packages.standard].filter((_) => !this._loadedPackages.standard.has(_));
    const missingMicropipPackages = [...this._packages.micropip].filter((_) => !this._loadedPackages.micropip.has(_));

    await this.postMessage({
      type: 'loadPackages',
      standardPackages: missingStandardPackages,
      micropipPackages: missingMicropipPackages,
    });

    // TODO errors, state on worker ?
    missingStandardPackages.forEach((_) => this._loadedPackages.standard.add(_));
    missingMicropipPackages.forEach((_) => this._loadedPackages.micropip.add(_));

    this._notifyChanges();
  }

  async loadPackages() {
    // TODO should block exec ?
    await this.ensureStarted();

    const moduleNotice = notifyInfo('Loading Pyodide packages...');
    try {
      this.pyodideState = PyodideManager.PYODIDE_STATE_LOADING;

      const result = await this._loadPackages();
      notifyInfo('Pyodide packages loaded');
      return result;
    } catch (error) {
      notifyError('Error while loading Pyodide packages', error);
      throw error;
    } finally {
      this.pyodideState = PyodideManager.PYODIDE_STATE_READY;
      this._notifyChanges();

      moduleNotice.remove();
    }
  }

  postMessage(msg) {
    const id = this.msgIdIterator++;

    return new Promise((resolve, reject) => {
      this.callbacks[id] = { resolve, reject };
      this.pyodideWorker.postMessage({
        id,
        ...msg,
      });
    });
  }

  async _loadPyodide() {
    this.pyodideState = PyodideManager.PYODIDE_STATE_LOADING;
    this._notifyChanges();

    const pyodideNotice = notifyInfo('Starting Pyodide...');
    try {
      this.pyodideWorker = new PyodideWorker();

      this.callbacks = {};

      this.pyodideWorker.onmessage = (event) => {
        const { id, ...data } = event.data;
        const { resolve, reject } = this.callbacks[id];
        delete this.callbacks[id];
        if (data.error) {
          reject(data);
        } else {
          resolve(data);
        }
      };

      await this.postMessage({ type: 'start' });
    } catch (error) {
      this.pyodideState = PyodideManager.PYODIDE_STATE_ERROR;
      this._notifyChanges();
      notifyError('Error while loading Pyodide', error);
      throw error;
    } finally {
      pyodideNotice.remove();
    }

    const moduleNotice = notifyInfo('Loading Pyodide packages...');
    try {
      await this._loadPackages();
    } catch (error) {
      notifyError('Error while loading Pyodide packages', error);
      throw error;
    } finally {
      this.pyodideState = PyodideManager.PYODIDE_STATE_READY;
      this._notifyChanges();

      moduleNotice.remove();
    }

    notifyInfo('Pyodide is ready');
  }

  async ensureStarted() {
    if (this.pyodideState === PyodideManager.PYODIDE_STATE_ERROR) {
      throw new Error('Pyodide did not start');
    } else if (this.pyodideState === PyodideManager.PYODIDE_STATE_NONE) {
      this.startPromise = this._loadPyodide();
    }
    await this.startPromise;
  }

  async runPythonAsync(code, jsGlobals = undefined) {
    await this.ensureStarted();
    const result = await this.postMessage({
      type: 'run',
      script: code,
      globals: jsGlobals,
    });
    return result;
  }

  _notifyChanges() {
    this._listeners.forEach((_) => _());
  }

  addListener(listener) {
    this._listeners.push(listener);
  }

  removeListener(listener) {
    this._listeners = this._listeners.filter((_) => _ != listener);
  }
}

export const pyodideManager = new PyodideManager();

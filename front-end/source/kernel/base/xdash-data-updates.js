// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ xdash-load                                                         │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2018-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT, Abir EL FEKI               │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

export class XdashDataUpdateInformation {
  constructor(fromVersion, toVersion, messages) {
    this.fromVersion = fromVersion;
    this.toVersion = toVersion;
    this.messages = messages;
  }
}

/**
 * Function tasked with updating a dashboard's description from one version to the next
 * @callback updateStep
 * @param {any} model json model of the dashboard to update
 * @param {boolean=} full true when updating of full dashboard, false when only "data" is present (xdsjson)
 * @returns {string[]=} Optional array of messages to report after the update. Can signal/highlight braking changes.
 */

/**
 * Stores a set of update steps and applies them to update data to the current version.
 * Update steps are selected based on their starting version. No two steps can share the same starting version.
 */
export class XdashDataUpdateEngine {
  static VERSION_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  static DEFAULT_VERSION = '0.0';
  static CURRENT_VERSION = '0.4';

  static VERSION_METADATA_KEY = 'fileFormatVersion';

  constructor() {
    // Map<string, XdashDataUpdateStep>
    this.steps = new Map();
  }

  /**
   * Factory for incremental updates.
   * @param {*} fromVersion data version the update applies to
   * @param {*} toVersion data version at the end of the update. Setting it is NOT the responsibility of `updateStep`.
   * @param {updateStep} fct implementation of the update
   * @returns the provided function decorated with the base and target versions
   */
  static createStep(fromVersion, toVersion, fct) {
    fct.fromVersion = fromVersion;
    fct.toVersion = toVersion;
    return fct;
  }

  /**
   * Decompose a version string into major and minor versions.
   * @param {string} versionStr
   * @returns {number[]=} major/minor version couple, or undefined if the given string is not well formed
   */
  static readVersion(versionStr) {
    const match = XdashDataUpdateEngine.VERSION_REGEX.exec(versionStr);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      return [major, minor];
    } else {
      return undefined;
    }
  }

  /**
   * @param {*} versionA
   * @param {*} versionB
   * @returns true if `versionA` is strictly greater than `versionB`
   */
  static isGreater(versionA, versionB) {
    const [majorA, minorA] = XdashDataUpdateEngine.readVersion(versionA);
    const [majorB, minorB] = XdashDataUpdateEngine.readVersion(versionB);
    return majorA > majorB || (majorA === majorB && minorA > minorB);
  }

  /**
   * Add new update steps
   * @param {Array.<updateStep>} moreSteps Array of update functions annotated with base and target version (see createStep)
   */
  registerSteps(moreSteps) {
    moreSteps.forEach((step) => {
      const from = step.fromVersion;
      const to = step.toVersion;

      if (!from) throw new Error('No starting version');
      if (!to) throw new Error('No target version');

      if (!XdashDataUpdateEngine.readVersion(from)) throw new Error(`Invalid starting version ${from}`);
      if (!XdashDataUpdateEngine.readVersion(to)) throw new Error(`Invalid target version ${to}`);

      if (!XdashDataUpdateEngine.isGreater(to, from)) {
        throw new Error(`Target version ${to} is not greater than starting version ${from}`);
      }

      if (this.steps.get(from)) {
        throw new Error(`There already is an update registered for version ${from}`);
      }

      this.steps.set(from, step);
    });
  }

  #collectUpdates(version) {
    const result = [];

    while (version !== XdashDataUpdateEngine.CURRENT_VERSION) {
      const update = this.steps.get(version);
      if (update) {
        result.push(update);
        version = update.toVersion;
      } else {
        return null;
      }
    }

    return result;
  }

  hasCurrentVersion(model) {
    const version = model.meta[XdashDataUpdateEngine.VERSION_METADATA_KEY] ?? XdashDataUpdateEngine.DEFAULT_VERSION;
    return version === XdashDataUpdateEngine.CURRENT_VERSION;
  }

  /**
   * Updates a dashboard model to match the current version
   * @param {*} model model to update. Will be modified.
   * @param {boolean=} full true when updating of full dashboard, false when only "data" is present (xdsjson)
   * @returns {Array.<XdashDataUpdateInformation>} Notifications for the user (most importantly the list of things that may have been broken by the update), grouped by version.
   */
  update(model, full = true) {
    const version = model.meta[XdashDataUpdateEngine.VERSION_METADATA_KEY] ?? XdashDataUpdateEngine.DEFAULT_VERSION;
    if (XdashDataUpdateEngine.isGreater(version, XdashDataUpdateEngine.CURRENT_VERSION)) {
      throw new Error(
        `Version ${version} is more recent than current version ${XdashDataUpdateEngine.CURRENT_VERSION}`
      );
    }

    const updates = this.#collectUpdates(version);
    if (!updates) {
      throw new Error(`There is no update path from version ${version} to ${XdashDataUpdateEngine.CURRENT_VERSION}`);
    }

    const messages = updates.flatMap((step) => {
      const msg = step(model, full);
      model.meta[XdashDataUpdateEngine.VERSION_METADATA_KEY] = step.toVersion;
      return msg?.length ? new XdashDataUpdateInformation(step.fromVersion, step.toVersion, msg) : [];
    });

    return messages;
  }

  displayNotifications(notifications, full = true) {
    if (notifications.length) {
      let text = `<div class="swal-text"><p>The ${
        full ? 'dashboard' : 'data'
      }'s definition was updated to match the current version.</p><br/>`;
      notifications.forEach((notif) => {
        text += `<p>Version ${notif.toVersion} notes:</p>`;
        text += '<ul>' + notif.messages.map((_) => `<li> - ${_}</li>`).join() + '</ul>';
        text += '<br/>';
      });
      text += '</div>';

      swal({
        title: `<strong>Update result</strong>`,
        icon: 'warning',
        html: true,
        text,
      });
    }
  }
}

export const xdashUpdateEngine = new XdashDataUpdateEngine();

(function () {
  function collectWidgetIds(model) {
    return new Set(Object.keys(model.dashboard));
  }

  function generateId(existingKeys, prefix) {
    const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const suffix = [0];
    let key;
    do {
      key = prefix + suffix.map((i) => CHARS[i]).join();

      suffix[0] += 1;
      let pos = 0;
      while (suffix[pos] >= CHARS.length) {
        suffix[pos] = 0;
        pos += 1;
        suffix[pos] = pos === suffix.length ? 0 : suffix[pos] + 1;
      }
    } while (existingKeys.has(key));

    return key;
  }

  function renameWidgets(model, idMap) {
    model.dashboard = Object.fromEntries(
      Object.entries(model.dashboard).map(([id, widget]) => {
        const newId = idMap.get(id) ?? id;
        widget.container.instanceId = newId;
        return [newId, widget];
      })
    );

    model.connections = Object.fromEntries(
      Object.entries(model.connections).map(([id, value]) => [idMap.get(id) ?? id, value])
    );

    Object.values(model.device.droppers ?? {}).forEach((drp) => {
      Object.entries(drp)
        .filter(([, widgetId]) => idMap.has(widgetId))
        .forEach(([key, widgetId]) => (drp[key] = idMap.get(widgetId)));
    });
  }

  const STEPS = [
    //
    // 0.0 -> 0.1
    // Old changes cleanup
    // 'datasources' renamed to 'datanodes'
    //
    XdashDataUpdateEngine.createStep('0.0', '0.1', (model, full) => {
      if (full) {
        // Very old projects
        model.device ??= {
          cols: {
            valueRow: 'none',
            valueCol: '1',
            maxCells: 0,
            maxCols: 0,
            classType: '',
          },
          droppers: {},
        };

        // Old projects
        const device = model.device;
        if (!device.cols.valueRow) {
          switch (device.cols.value ?? 'none') {
            case 'none':
              device.cols.valueRow = 'none';
              break;
            case '1':
            case '3':
              device.cols.valueRow = '1';
              break;
            case '6':
              device.cols.valueRow = '6';
              break;
            default:
              device.cols.valueRow = 'none';
          }
        }
        if (!device.cols.valueCol) {
          switch (device.cols.value ?? 'none') {
            case 'none':
            case '1':
              device.cols.valueCol = '1';
              break;
            case '3':
            case '6':
              device.cols.valueCol = '3';
              break;
            default:
              device.cols.valueCol = '1';
          }
        }
        delete device.cols.value;
      }

      //
      // datasources => datanodes
      //
      const data = model.data;
      if (!data.datanodes) {
        data.datanodes = data.datasources ?? data.dataNodes ?? [];
        ['datasources', 'dataNodes'].forEach((prop) => {
          if (data[prop] !== undefined) {
            delete data[prop];
          }
        });
      }

      Object.values(model.connections ?? []).forEach((wdgConnections) => {
        Object.values(wdgConnections).forEach((connector) => {
          if (connector.dataSource) {
            connector.dataNode = connector.dataSource;
            delete connector.dataSource;
          }
          if (connector.dataSourceIndex) {
            connector.dataNodeIndex = connector.dataSourceIndex;
            delete connector.dataSourceIndex;
          }
        });
      });

      const warn = new Set();
      data.datanodes.forEach((node) => {
        const settings = node.settings;
        if (settings.refresh !== undefined) {
          // older name for clk, REST WS, FMI, Weather
          settings.sampleTime = settings.refresh;
          delete settings.refresh;
        } else if (settings.refresh_time !== undefined) {
          // csvPlayer
          settings.sampleTime = settings.refresh_time;
          delete settings.refresh_time;
        } else if (settings.refresh_rate !== undefined) {
          // websocket send
          settings.sampleTime = settings.refresh_rate;
          delete settings.refresh_rate;
        } else if (settings.refreshRate !== undefined) {
          // geolocalisation
          settings.sampleTime = settings.refreshRate;
          delete settings.refreshRate;

          //AEF: compatibility with versions before Chalk'it v0.3.7 (xDash 2.890)
          const versionStr = model.meta.version;
          const RegEx = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
          const match = RegEx.exec(versionStr);
          if (match) {
            const major = parseInt(match[1], 10);
            const minor = parseInt(match[2], 10);
            const lower = major < 0 || (major === 0 && minor < 7);
            if (lower) {
              if (settings.explicitTrig && settings.autoStart) {
                settings.autoStart = false;
              }
            }
          }
        }

        function doReplace(key) {
          const value = settings[key];
          if (value) {
            settings[key] = value
              .replaceAll('datasources', 'dataNodes')
              .replaceAll('headersFromDatasourceWS', 'headersFromDataNodeWS');
            if (value !== settings[key]) {
              warn.add(node.name);
            }
          }
        }
        const type = node.type;
        switch (type) {
          case 'FMI_web-service_from_datasource':
            doReplace('body');
            break;

          case 'REST_web-service_from_datasource':
          case 'REST_web-service_from_JSON_editor':
            doReplace('body');
            delete settings.use_jsonp;
            if (settings.use_thingproxy !== undefined) {
              settings.use_xproxy = !!settings.use_thingproxy;
              delete settings.use_thingproxy;
            }

            settings.req_data_type ??= 'none';
            settings.headers ??= [];
            if (settings.headers.length === 0) {
              settings.req_data_type = 'none';
              settings.headers = [{ name: '', value: '' }];
            }
            break;

          case 'WS-send-plugin':
          case 'JSON_memory_plugin':
            doReplace('json_input');
            break;

          case 'JSON_formula_plugin':
            doReplace('json_var_formula');
            break;

          case 'Python_inline_plugin':
          case 'Python_pyodide_plugin':
            doReplace('content');
            break;
        }
      });
      if (warn.size) {
        const nodes = [...warn]
          .sort()
          .map((_) => `"${_}"`)
          .join(', ');
        return [`"datasources" has been renamed to "dataNodes". The following nodes may need to be updated : ${nodes}`];
      }
    }),

    //
    // 0.1 -> 0.2
    // Python rework
    //
    XdashDataUpdateEngine.createStep('0.1', '0.2', (model, full) => {
      const datanodes = model.data.datanodes;
      const pythonNodes = datanodes.filter((_) => _.type === 'Python_inline_plugin');
      const pyodideNodes = datanodes.filter((_) => _.type === 'Python_pyodide_plugin');
      const allPython = [...pythonNodes, ...pyodideNodes];

      allPython.forEach((_) => (_.type = 'Python_plugin'));

      pyodideNodes.forEach(
        (_) =>
          (_.settings.dockerImage = {
            name: 'Pyodide',
            id: '__PYODIDE__',
          })
      );

      const warn = new Set();

      pythonNodes.forEach((_) => {
        if (_.settings.splat || _.settings.munch || _.settings.function || _.settings.args) {
          warn.add(_.name);

          if (_.settings.args) {
            _.settings.content = 'args = ' + _.settings.args + '\n' + _.settings.content;
          }

          delete _.settings.splat;
          delete _.settings.munch;
          delete _.settings.function;
          delete _.settings.args;
        }
      });

      if (warn.size) {
        const nodes = [...warn]
          .sort()
          .map((_) => `"${_}"`)
          .join(', ');
        return [
          `Following changes to the wiring of Python scripts, the following nodes may need to be updated : ${nodes}`,
        ];
      } else {
        return [];
      }
    }),

    //
    // 0.2 -> 0.3
    // flatUiValue widget split
    // widget configuration tidying
    //
    XdashDataUpdateEngine.createStep('0.2', '0.3', (model, full) => {
      delete model.data.reIndexMap;
      delete model.data.noTopologicalSortAtSerialize;

      if (!full) return;

      // Split flatUiValue into flatUiValueDisplay/flatUiNumericInput/flatUiTextInput
      const dashboard = model.dashboard;
      const connections = model.connections;

      const writableNodes = model.data.datanodes
        .filter((node) => node.type === 'JSON_var_plugin')
        .map((node) => node.name);

      const currentIds = collectWidgetIds(model);
      const idMap = new Map();

      Object.entries(dashboard)
        .filter(([, widget]) => widget.container.modelJsonId === 'flatUiValue')
        .forEach(([oldId, widget]) => {
          const wdgConnection = connections[oldId];
          const valueConnection = wdgConnection.value.dataNode;
          const hasWritableConnection = valueConnection && writableNodes.includes(valueConnection);

          const modelParameters = widget.modelParameters;
          let newType = 'flatUiValueDisplay';
          if (hasWritableConnection) {
            newType = modelParameters.isNumber ? 'flatUiNumericInput' : 'flatUiTextInput';
          }

          delete modelParameters.decimalDigits;
          if (newType !== 'flatUiValueDisplay') delete modelParameters.isNumber;
          if (newType !== 'flatUiTextInput') delete modelParameters.isPassword;

          const newId = generateId(currentIds, newType);
          currentIds.add(newId);
          idMap.set(oldId, newId);

          widget.container.modelJsonId = newType;
        });

      renameWidgets(model, idMap);

      // Cleanup some old widget configuration
      Object.values(dashboard).forEach((widget) => {
        const modelParameters = widget.modelParameters;
        const modelHiddenParams = widget.modelHiddenParams;

        delete widget.container.id; // always instanceId
        delete widget.container.widgetTypeName; // Never read

        switch (widget.container.modelJsonId) {
          case 'annotationImage':
            delete modelHiddenParams.widthPx;
            delete modelHiddenParams.heightPx;
            delete modelHiddenParams.ratio;
            break;

          case 'flatUiDoubleSlider':
            modelParameters.forceValuesToMinAndMax ??= false;
            break;

          case 'plotlyLine':
          case 'plotlyBar':
          case 'plotlyPie':
          case 'plotly3dSurface':
          case 'plotlyGeneric':
          case 'plotlyRealTime':
            modelParameters.hideModeBar ??= false;
            break;

          case 'flatUiSelect':
            modelParameters.isKeyValuePairs ??= true;

            if (modelParameters.isKeyValuePairs && Array.isArray(modelHiddenParams.value)) {
              modelHiddenParams.values = modelHiddenParams.value.map((it) => it.value ?? it.key);
              modelHiddenParams.keys = modelHiddenParams.value.map((it) => it.key);
            } else {
              modelHiddenParams.values ??= [];
              modelHiddenParams.keys ??= [];
            }
            delete modelHiddenParams.value;

            break;

          case 'flatUiCheckbox':
            modelParameters.checkboxSize ??= 1;
            modelParameters.checkboxColor ??= '#447bdc';
            break;

          case 'flatUiTable':
            modelParameters.noBorder ??= false;
            break;

          case 'ledStatus':
            delete modelParameters.redAtStateOff;
            modelParameters.onColor ??= '#00b700';
            modelParameters.offColor ??= '#004d00';
            break;
        }
      });
    }),
    //
    // 0.3 -> 0.4
    // use PX coordinates for widgets
    // rows replaced by pages
    //
    XdashDataUpdateEngine.createStep('0.3', '0.4', (model, full) => {
      if (!full) return;

      const device = model.device;
      const scaling = model.scaling;
      const exportOptions = model.checkExportOptions;
      const oldPages = model.pages;
      delete model.scaling;
      delete model.device;
      delete model.checkExportOptions;
      delete model.exportOptions;
      delete model.pages;

      let width = scaling.widthPx;
      let height = scaling.heightPx;
      const margin = 10;

      function readVh(str) {
        const val = parseFloat(str.replaceAll('vh', ''));
        return Math.round((window.innerHeight * val) / 100);
      }

      function readVw(str) {
        const val = parseFloat(str.replaceAll('vw', ''));
        return Math.round((window.innerWidth * val) / 100);
      }

      Object.values(model.dashboard).forEach((widget) => {
        const oldLayout = widget.layout;

        const top = readVh(oldLayout.top) - margin;
        const left = readVw(oldLayout.left) - margin;
        const height = readVh(oldLayout.height);
        const width = readVw(oldLayout.width);

        widget.layout = {
          top,
          left,
          height,
          width,
          'z-index': oldLayout['z-index'],
        };
      });

      const maxCells = device.cols.maxCells;
      if (maxCells) {
        const rows = parseInt(device.cols.valueRow, 10);
        const cols = parseInt(device.cols.valueCol, 10);
        const colWidth = Math.round(window.innerWidth / cols);

        const needPages = rows > 1 || oldPages?.pageNames?.length;

        let cell = 1;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const widgets = Object.values(device.droppers[`dpr${cell}`]);
            for (const widgetId of widgets) {
              const widget = model.dashboard[widgetId];
              widget.layout.left = widget.layout.left + col * colWidth;
              if (needPages) {
                widget.layout.page = row;
              }
            }
            cell += 1;
          }
        }

        if (needPages) {
          let pageNames = [];
          if (oldPages?.pageNames?.length) {
            pageNames = oldPages.pageNames;
          }
          for (let row = pageNames.length; row < rows; row++) {
            pageNames.push(`Page ${row + 1}`);
          }

          model.pages = {
            pageNames,
            pageMode: 'pages',
          };

          if (exportOptions === 'customNavigation') {
            model.pages.pageMode = 'custom';

            let initialPage = 0;
            const defaultPage = oldPages?.defaultPage?.id;
            if (defaultPage) {
              initialPage = parseInt(defaultPage, 10);
            }

            model.pages.initialPage = initialPage;
          } else if (exportOptions === 'rowToTab') {
            model.pages.pageMode = 'tabs';
          }
        }
      }

      Object.values(model.dashboard).forEach((widget) => {
        const layout = widget.layout;
        width = Math.max(width, layout.left + layout.width);
        height = Math.max(height, layout.top + layout.height);
      });

      model.display = {
        theme: device.theme,
        backgroundColor: device.backgroundColor,
        inheritThemeBackgroundColor: device.inheritThemeBackgroundColor ?? true,

        marginX: margin,
        marginY: margin,
        width,
        height,
        enforceHeightLimit: false,
      };
    }),
  ];

  xdashUpdateEngine.registerSteps(STEPS);
})();

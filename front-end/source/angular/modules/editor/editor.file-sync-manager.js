// ┌────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ editor.file-sync-manager                                                           │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2023 IFPEN                                                        │ \\
// | Licensed under the Apache License, Version 2.0                                     │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                             │ \\
// └────────────────────────────────────────────────────────────────────────────────────┘ \\

/**
 * This service requires a (probably local) server which answers on '/FileSyncURI' with
 * the location of a websocket. This is expected to be 'serve.py' with the '--syncDir' option.
 *
 * It will use the EventCenterService to monitor datanode changes and allow them to expose some
 * settings as files.
 *
 * Participating datanode plugins should include a 'expose_as_files' property in their definition. Its
 * value must be an array of objects defining the exposed files :
 * {
 *    key: mandatory. string. Identify the file internally. May be a key in the datanode settings.
 *    nameSuffix: mandatory. string or function accepting the datanode settings and returning a string. Suffix 
 *                used to build the file name. Expected to end with the file extension (and may be only the extension)
 *    getter: optional. string or function accepting the datanode settings and returning the file's content 
 *            as a base64 endoded string. Strings are interpreted as the name of a property in the datanode's settings, which 
 *            should be a string. If omitted, 'key' is used.
 *    setter: optional. string or function accepting the datanode settings and the new value (as a base64 encoded string
 *            which is expected to update the settings accordingly. Strings are interpreted as the name of a property in the 
 *            datanode's settings, which should be a string. If omitted, 'key' is used.
 * }
 */
class FileSyncManager {
  /**
   * @param {EventCenter} eventCenter
   */
  constructor(eventCenter) {
    this._eventCenter = eventCenter;

    this._nextId = 0;
    this._filesPerId = new Map();
    this._filesPerDatanode = new Map();
  }

  start(websocketUri) {
    // TODO ReconnectingWebSocket ?
    this._webSocket = new WebSocket(websocketUri);
    this._webSocket.onopen = () => {
      this._eventCenter.addListener(EVENTS_EDITOR_DATANODE_CREATED, angular.bind(this, this._onDatanodeCreated));
      this._eventCenter.addListener(EVENTS_EDITOR_DATANODE_DELETED, angular.bind(this, this._onDatanodeDeleted));
      this._eventCenter.addListener(EVENTS_EDITOR_DATANODE_UPDATED, angular.bind(this, this._onDatanodeUpdated));

      this._webSocket.onmessage = (event) => {
        this._onmessage(JSON.parse(event.data));
      };

      if (window.datanodesManager) {
        const nodeNames = datanodesManager.getAllDataNodes().map((_) => _.name());
        if (nodeNames.length) {
          this._onDatanodeCreated(nodeNames);
        }
      }
    };
  }

  _onmessage(event) {
    switch (event.type) {
      case 'file_modified':
        const fileStruct = this._filesPerId[event.id];
        if (fileStruct) {
          const content = event.content;
          const dnModel = datanodesManager.getDataNodeByName(fileStruct.dnName);
          const newSettings = { ...dnModel.settings() };
          fileStruct.setterFct(newSettings, content);
          fileStruct.content = content;

          const type = dnModel.type();
          const types = datanodesManager.getDataNodePluginTypes();
          const selectedType = types[type];
          datanodesManager.updateDatanode(dnModel, {
            type: type,
            iconType: selectedType.icon_type,
            settings: newSettings,
          });
        } else {
          console.warn(`Unknown file id: ${event.id}`);
        }
        break;

      case 'file_deleted':
        const fileStructDel = this._filesPerId[event.id];
        if (fileStructDel) {
          const dnModel = datanodesManager.getDataNodeByName(fileStructDel.dnName);
          datanodesManager.deleteDataNode(dnModel, 'datanode', 'datanode');
        } else {
          console.warn(`Unknown file id: ${event.id}`);
        }
        break;

      default:
        console.warn(`Unexpected message type: ${event.type}`);
        break;
    }
  }

  _createGetterFct(propKey, getter) {
    if (getter) {
      if (typeof getter === 'string') {
        return (settings) => b64EncodeUnicode(settings[getter]);
      } else {
        return getter;
      }
    } else {
      return (settings) => b64EncodeUnicode(settings[propKey]);
    }
  }

  _createSetterFct(propKey, setter) {
    if (setter) {
      if (typeof setter === 'string') {
        return (settings, value) => (settings[setter] = b64DecodeUnicode(value));
      } else {
        return setter;
      }
    } else {
      return (settings, value) => (settings[propKey] = b64DecodeUnicode(value));
    }
  }

  _createNameSuffixFct(fileName) {
    if (typeof fileName === 'string') {
      return () => fileName;
    } else {
      return fileName;
    }
  }

  _onDatanodeCreated(event) {
    const files = [];
    event.forEach((dnName) => {
      const dnModel = datanodesManager.getDataNodeByName(dnName);

      const settings = dnModel.settings();

      const typeDef = datanodesManager.getDataNodePluginTypes()[dnModel.type()];
      const fileDefs = typeDef.expose_as_files ?? [];
      fileDefs.forEach((fd) => {
        const id = this._nextId++;

        const propKey = fd.key;
        const nameSuffixFct = this._createNameSuffixFct(fd.nameSuffix);
        const getterFct = this._createGetterFct(propKey, fd.getter);
        const setterFct = this._createSetterFct(propKey, fd.setter);

        const content = getterFct(settings);
        const fileName = `${dnName}__${nameSuffixFct(settings)}`;

        const fileStruct = {
          id,
          dnName,
          propKey,
          nameSuffixFct,
          getterFct,
          setterFct,
          content,
        };

        this._filesPerId[id] = fileStruct;
        if (!this._filesPerDatanode[dnName]) this._filesPerDatanode[dnName] = {};
        this._filesPerDatanode[dnName][propKey] = fileStruct;

        files.push({
          id,
          name: fileName,
          content: content,
        });
      });
    });
    if (files.length) {
      this._webSocket.send(
        JSON.stringify({
          type: 'set_files',
          files,
        })
      );
    }
  }

  _onDatanodeDeleted(event) {
    const files = [];
    event.forEach((dnName) => {
      const filesDescs = this._filesPerDatanode[dnName];
      if (filesDescs) {
        Object.values(filesDescs).forEach((f) => {
          delete this._filesPerId[f.id];
          files.push(f.id);
        });
        delete this._filesPerDatanode[dnName];
      }
    });

    if (files.length) {
      this._webSocket.send(
        JSON.stringify({
          type: 'delete_files',
          files,
        })
      );
    }
  }

  _onDatanodeUpdated({ oldName, newName }) {
    if (oldName !== newName) {
      this._onDatanodeDeleted([oldName]);
      this._onDatanodeCreated([newName]);
    } else {
      const dnModel = datanodesManager.getDataNodeByName(newName);
      const settings = dnModel.settings();

      const files = [];

      const filesDescs = this._filesPerDatanode[newName];
      if (filesDescs) {
        Object.values(filesDescs).forEach((f) => {
          const newContent = f.getterFct(settings);
          if (newContent !== f.content) {
            f.content = newContent;

            files.push({
              id: f.id,
              name: `${newName}__${f.nameSuffixFct(settings)}`,
              content: newContent,
            });
          }
        });
      }
      if (files.length) {
        this._webSocket.send(
          JSON.stringify({
            type: 'set_files',
            files,
          })
        );
      }
    }
  }
}

/* angular
  .module('modules.editor')
  .service('FileSyncService', ['EventCenterService', FileSyncManager])
  .run([
    '$http',
    '$injector',
    async function ($http, $injector) {
      if (xServConfig.url) {
        try {
          const r = await $http.get(`${xServConfig.url}/FileSyncURI`);
          $injector.invoke([
            'FileSyncService',
            function (fileSyncService) {
              fileSyncService.start(r.data);
            },
          ]);
        } catch (err) {
          if (err.status === 404) {
            console.debug('File synchronization not available');
          } else {
            throw err;
          }
        }
      }
    },
  ]);
 */
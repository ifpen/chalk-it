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
 * Participating datanodes should mark settings to expose as a file with a 'expose_as_file' property
 * and provide an extension for the files. Ex: 'expose_as_file: { extension: "json" }'
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
          const content = b64DecodeUnicode(event.content);
          const dnModel = datanodesManager.getDataNodeByName(fileStruct.dnName);
          const newSettings = { ...dnModel.settings(), [fileStruct.propKey]: content };

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

  _onDatanodeCreated(event) {
    const files = [];
    event.forEach((dnName) => {
      const dnModel = datanodesManager.getDataNodeByName(dnName);

      const settings = dnModel.settings();

      const typeDef = datanodesManager.getDataNodePluginTypes()[dnModel.type()];
      const settingsDef = typeDef.settings;
      settingsDef
        .filter((_) => _.expose_as_file)
        .forEach((s) => {
          const id = this._nextId++;
          const propKey = s.name;
          const content = settings[propKey];
          const fileName = `${dnName}__${s.display_name}.${s.expose_as_file.extension}`;

          const fileStruct = {
            id,
            dnName,
            propKey,
            fileName,
            content,
          };

          this._filesPerId[id] = fileStruct;
          if (!this._filesPerDatanode[dnName]) this._filesPerDatanode[dnName] = {};
          this._filesPerDatanode[dnName][propKey] = fileStruct;

          files.push({
            id,
            name: fileName,
            content: b64EncodeUnicode(content),
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
          const newContent = settings[f.propKey];
          if (newContent !== f.content) {
            f.content = newContent;
            files.push({
              id: f.id,
              name: f.fileName,
              content: b64EncodeUnicode(newContent),
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

angular
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

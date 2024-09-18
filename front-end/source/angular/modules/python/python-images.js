// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ PythonImagesManager                                                              │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                           │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

import { xDashConfig, urlPython } from 'config.js';
import { FileMngrFct } from 'kernel/general/backend/FileMngr';
import _ from 'lodash';
import { DialogBox } from 'kernel/datanodes/gui/DialogBox';
import { b64DecodeUnicode, formatDataSize } from 'kernel/datanodes/plugins/thirdparty/utils';
import { getAuthorizationHeaders } from 'angular/modules/components/auth-utils';

export const pythonImagesModule = angular
  .module('modules.python-images', [])
  .config([
    '$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('modules.python-images', {
        notAuthenticate: true,
        userAuthenticated: false,
        abstract: true,
        url: '/python-images',
        template: '<div ui-view></div>',
      });
    },
  ])
  .service('PythonImagesManager', [
    '$http',
    function ($http) {
      const self = this;

      this.getImages = async () => {
        const pythonImages = await _listPythonFiles();
        return pythonImages ? pythonImages : [];
      };

      function responseCallback(msg, type) {
        if (type === 'success') {
          //console.log(msg);
          //swal(msg, "", type);
        } else {
          throw Error(msg);
        }
      }

      this.createImage = async (image, fileInfo, progressCallback) => {
        await _saveFileData(image, fileInfo.data, progressCallback);
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.AddPythonInfo(
          image.Id,
          responseCallback,
          image.BaseImage,
          '',
          image.Name,
          image.Description,
          image.FileName,
          image.FileSize
        );
      };

      this.updateImage = async (image, imageOld, fileInfo = {}, progressCallback) => {
        if (image.Hash) {
          if (!_.isUndefined(imageOld)) {
            if (fileInfo.data || imageOld.FileName !== image.FileName || imageOld.BaseImage !== image.BaseImage) {
              image.Hash = undefined;
            }
          }
        }

        if (fileInfo.data) {
          await _saveFileData(image, fileInfo.data, progressCallback);
        }
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.AddPythonInfo(
          image.Id,
          responseCallback,
          image.BaseImage,
          image.Hash,
          image.Name,
          image.Description,
          image.FileName,
          image.FileSize
        );
        const pythonImages = await _listPythonFiles();
        if (!pythonImages) {
          throw Error(`No images defined`);
        }

        const idx = pythonImages.findIndex((i) => i.Id === image.Id);
        if (idx === -1) {
          throw Error(`Image ${image.Id} does not exist`);
        }

        pythonImages[idx] = image;
      };

      this.deleteImage = async (image) => {
        const url = urlPython + `images/${image.Id}`;
        $http.delete(url, { headers: getAuthorizationHeaders() });
        _purgeFileData(image.Id);
      };

      // execServer
      // {status: "building" | "ready"; hash: string}
      this.buildImage = async (image) => {
        // TODO err msg
        const url = urlPython + 'images/build';
        const body = {
          id: image.Id,
          baseImage: image.BaseImage,
          fileData: await _loadFileData(image.Id),
          fileName: image.FileName,
        };
        const result = await $http.post(url, body, { headers: getAuthorizationHeaders() });
        return result.data;
      };

      // export interface IImageStatus {
      //     id: string;
      //     hash: string;
      //     status: "building" | "ready" | "error";
      //     progress?: number;
      //     output?: string;
      //     size?: number;
      // }
      this.getImageFullStatus = async (id) => {
        const url = urlPython + `images/${id}`;
        const result = await $http.get(url, { headers: getAuthorizationHeaders() });
        return result.data;
      };

      // Sames as getImageFullStatus, but in an array with no output
      this.getImagesStatus = async (ids) => {
        const url = urlPython + 'images/list';
        const result = await $http.post(url, ids, { headers: getAuthorizationHeaders() });
        return result.data;
      };

      function _createId(useHex = true) {
        const array = new Uint32Array(8);
        window.crypto.getRandomValues(array);
        let str = '';
        for (let i = 0; i < array.length; i++) {
          str += (i < 2 || i > 5 ? '' : '-') + array[i].toString(useHex ? 16 : 36).slice(-4);
        }
        return str;
      }

      function _listFiles() {
        return new Promise((resolve, reject) => {
          var FileMngrInst = new FileMngrFct();
          FileMngrInst.GetFileList(
            'pydata',
            (result, msg, type) => {
              if (type === 'success') {
                resolve(result.FileList.map((it) => it.Name));
              } else {
                reject(result);
              }
            },
            false
          );
        });
      }

      function _listPythonFiles() {
        return new Promise((resolve, reject) => {
          var FileMngrInst = new FileMngrFct();
          FileMngrInst.GetFileList(
            'pydata',
            (result, msg, type) => {
              if (type === 'success') {
                resolve(result.FileList.map((it) => it.Python));
              } else {
                reject(result);
              }
            },
            false
          );
        });
      }

      function _deleteFile(id) {
        return new Promise((resolve, reject) => {
          var FileMngrInst = new FileMngrFct();
          FileMngrInst.DeleteFile('pydata', id, (result, msg, type) => {
            if (type === 'error') {
              reject(result);
            } else {
              resolve(result);
            }
          });
        });
      }

      async function _purgeFileData(id) {
        const files = await _listFiles();
        const images = await self.getImages();
        const ids = images.map((i) => i.Id);
        _deleteFile(id);
      }

      function _loadFileData(id) {
        return new Promise((resolve, reject) => {
          var FileMngrInst = new FileMngrFct();
          FileMngrInst.ReadFile('pydata', id, (result, msg, type) => {
            if (type === 'success') {
              resolve(b64DecodeUnicode(result));
            } else {
              reject(result);
            }
          });
        });
      }

      function _saveFileData(image, content, progressCallback) {
        const id = image.Id;
        if (progressCallback) {
          progressCallback(0);
        }
        return new Promise((resolve, reject) => {
          var FileMngrInst = new FileMngrFct();
          FileMngrInst.SendText(
            'pydata',
            id,
            content,
            (result, msg, type) => {
              if (type === 'success') {
                resolve(result);
              } else {
                reject(result);
              }
            },
            progressCallback
          );
        });
      }

      // UI
      const ATTR_NAME = 'name';
      const ATTR_DESCRIPTION = 'desc';
      const ATTR_FILE = 'file';
      const ATTR_BASE = 'base';

      const DEFAULT_BASE_IMAGE = 'python:3.8';

      let BASE_IMAGES;

      if (!xDashConfig.disablePythonSlim) {
        BASE_IMAGES = [
          { label: 'python:3.10-slim', value: 'python:3.10-slim' },
          { label: 'python:3.10', value: 'python:3.10' },
          { label: 'python:3.9-slim', value: 'python:3.9-slim' },
          { label: 'python:3.9', value: 'python:3.9' },
          { label: 'python:3.8-slim', value: 'python:3.8-slim' },
          { label: 'python:3.8', value: DEFAULT_BASE_IMAGE },
          { label: 'python:3.7-slim', value: 'python:3.7-slim' },
          { label: 'python:3.7', value: 'python:3.7' },
          { label: 'python:3.6-slim', value: 'python:3.6-slim' },
          { label: 'python:3.6', value: 'python:3.6' },
        ];
      } else {
        BASE_IMAGES = [
          { label: 'python:3.10', value: 'python:3.10' },
          { label: 'python:3.9', value: 'python:3.9' },
          { label: 'python:3.8', value: DEFAULT_BASE_IMAGE },
          { label: 'python:3.7', value: 'python:3.7' },
          { label: 'python:3.6', value: 'python:3.6' },
        ];
      }

      const MAX_FILE_SIZE = 1000 * 1000 * 1000; // 1Gb ?
      const OUTPUT_REFRESH_INTERVAL = 5000;

      this.openOutputDialog = async (id, okCallback) => {
        const pythonImagesManager = this;

        function updateText(result) {
          if (result.output) {
            const pre = $('#outputText');
            pre.text(result.output.replace(/\r\n/g, '\n'));
            const parentDiv = pre.parent();
            parentDiv.animate({ scrollTop: parentDiv.prop('scrollHeight') });
          }
          if (result.status === 'building') {
            setTimeout(
              async () => updateText(await pythonImagesManager.getImageFullStatus(id)),
              OUTPUT_REFRESH_INTERVAL
            );
          }
        }

        const result = await this.getImageFullStatus(id);
        const content = $('<div><pre id="outputText" style="color: white; background-color: black"></div>');
        new DialogBox(content, 'Build output', 'Close', null, () => {
          if (okCallback) {
            okCallback(image);
          }

          return false;
        });
        updateText(result);
      };

      this.openNewImageDialog = () => {
        const image = { BaseImage: DEFAULT_BASE_IMAGE, Id: _createId(false) };
        const fileInfo = {};
        $('#editForm').append(createEditForm(image, fileInfo));
        return [image, fileInfo];
      };

      this.openEditImageDialog = (image) => {
        const editedImage = _.clone(image);
        const fileInfo = {};
        $('#editForm').append(createEditForm(editedImage, fileInfo));
        return [editedImage, fileInfo];
      };

      function createEditForm(image, fileInfo) {
        const form = $('<div style="margin: 10px 0 10px 0"></div>');

        const nameRow = _createRow(ATTR_NAME, 'Image name', form);
        const nameInput = $('<input type="text">')
          .appendTo(nameRow)
          .change(function () {
            image.Name = $(this).val();
            _checkImageValidity(image, fileInfo);
          });
        if (image.Name) {
          nameInput.val(image.Name);
        }

        const descRow = _createRow(ATTR_DESCRIPTION, 'Image description', form);
        const descInput = $('<textarea class="calculated-value-input">')
          .appendTo(descRow)
          .change(function () {
            image.Description = $(this).val();
            _checkImageValidity(image, fileInfo);
          });
        if (image.Description) {
          descInput.val(image.Description);
        }

        const baseRow = _createRow(ATTR_BASE, 'Base image', form);
        const baseSelect = $('<select></select>').appendTo($('<div class="styled-select"></div>').appendTo(baseRow));
        BASE_IMAGES.forEach((img) => {
          baseSelect.append($(`<option>${img.label}</option>`).attr('value', img.value));
        });

        baseSelect.change(function () {
          image.BaseImage = $(this).val();
          _checkImageValidity(image, fileInfo);
        });
        if (image.BaseImage) {
          baseSelect.val(image.BaseImage);
        }

        const origFile = image.FileName ? _imageFileDisplay(image.FileName, image.FileSize) : '';
        const fileInput = $(
          `<input type="text" id="select_file_path" value="${origFile}"></input><label class="board-toolbar datasource-input-suffix"><i class="fa-folder-open fa" aria-hidden="true"></i>Browse...</label>`
        );
        const fileDialog = $(
          '<input type="file" style="display: none" id="select_file" accept=".zip, .txt"></input>'
        ).appendTo(fileInput);
        fileInput.mousedown(function (e) {
          e.preventDefault();
          $('#select_file').trigger('click');
        });

        fileDialog.change(function (e) {
          if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const fileName = file.name;
            if (file.size > MAX_FILE_SIZE) {
              _clearValidationErrors(ATTR_FILE);
              _displayValidationError(ATTR_FILE, `File ${fileName} is too big.`);
            } else {
              const reader = new FileReader();

              reader.addEventListener('load', function (event) {
                const dataFile = event.target;
                const content = dataFile.result;
                const fileSize = file.size;

                fileInfo.data = content.replace(/^data:.+;base64,/, '');
                image.FileName = fileName;
                image.FileSize = fileSize;

                $('#select_file_path').val(_imageFileDisplay(fileName, fileSize));
                _checkImageValidity(image, fileInfo);
              });

              reader.readAsDataURL(file);
            }
          }
        });

        const fileRow = _createRow(ATTR_FILE, 'Package/requirements', form);
        fileInput.appendTo(fileRow);

        return form;
      }

      function _createRow(name, displayName, form) {
        var tr = $('<div id="setting-row-' + name + '" class="form-row"></div>').appendTo(form);

        tr.append('<div class="form-label"><label class="control-label">' + displayName + '</label></div>');
        return $('<div id="setting-value-container-' + name + '" class="form-value"></div>').appendTo(tr);
      }

      function _checkImageValidity(image, fileInfo) {
        var isValid = true;

        _clearValidationErrors(ATTR_NAME);
        if ((image.Name || '').trim().length === 0) {
          _displayValidationError(ATTR_NAME, 'This is required');
          isValid = false;
        }
        _clearValidationErrors(ATTR_FILE);
        if ((image.FileSize || 0) <= 0) {
          _displayValidationError(ATTR_FILE, 'Either a requirement file or a package is required');
          isValid = false;
        }

        _clearValidationErrors(ATTR_BASE);
        if ((image.BaseImage || '').trim().length === 0) {
          _displayValidationError(ATTR_BASE, 'Base image is mandatory');
          isValid = false;
        }

        return isValid;
      }
      this.checkImageValidity = _checkImageValidity;

      function _displayValidationError(settingName, errorMessage) {
        const errorElement = $('<div class="validation--error"></div>').html(errorMessage);
        $('#setting-value-container-' + settingName).append(errorElement);
      }

      function _clearValidationErrors(settingName) {
        const node = $('#setting-value-container-' + settingName);
        node.children('.validation--error').remove();
      }

      function _imageFileDisplay(fileName, fileSize) {
        var result = '';

        if (fileName) {
          result += fileName;
        }

        if (fileSize && fileSize > 0) {
          result += ' (' + formatDataSize(fileSize) + ')';
        }

        return result;
      }
    },
  ]);

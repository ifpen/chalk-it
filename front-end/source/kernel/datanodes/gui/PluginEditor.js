// +--------------------------------------------------------------------+ \\
// ¦ PluginEditor                                                       ¦ \\
// +--------------------------------------------------------------------¦ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// +--------------------------------------------------------------------¦ \\
// │ Licensed under the MIT license.                                    │ \\
// +--------------------------------------------------------------------¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2016-2023 IFPEN                                        ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Abir EL FEKI                                  ¦ \\
// +--------------------------------------------------------------------+ \\


PluginEditor = function(jsEditor) {
    function _displayValidationError(settingName, errorMessage) {
        var errorElement = $('<div class="validation--error"></div>').html(errorMessage);
        var node;
        //ABK
        if (!_.isUndefined($("#setting-value-container-data_path")[0]))
            node = $("#setting-value-container-data_path")[0].childNodes[$("#setting-value-container-data_path")[0].childNodes.length - 1];

        if (settingName == "data_path") {
            if (!_.isUndefined(node))
                node.style.display = "table-cell";
            errorElement[0].style.display = "table-cell";
            errorElement[0].style.height = "25px";
        }
        if (settingName == "name" || settingName == "url") {
            if (!_.isUndefined(node))
                node.style.display = "";
            errorElement[0].style.display = "";
        }
        //
        $("#setting-value-container-" + settingName).append(errorElement);
    }

    function _isNumerical(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function _appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue, includeRemove, settingsSavedCallback) {
        var input = $('<textarea autocorrect="off" autocomplete="off" spellcheck="false" class="calculated-value-input" style="display:none; width:78%"></textarea>');

        if (settingDef.multi_input) {
            input.change(function() {
                var arrayInput = [];
                $(valueCell).find('textarea').each(function() {
                    var thisVal = $(this).val();
                    if (thisVal) {
                        arrayInput = arrayInput.concat(thisVal);
                    }
                });
                newSettings.settings[settingDef.name] = arrayInput;
            });
        } else {
            input.change(function() {
                newSettings.settings[settingDef.name] = $(this).val();
            });
        }

        if (currentValue) {
            input.val(currentValue);
        }

        var datanodeToolbox = $('<div class="codemirror-wrapper__top"></div>');
        var wrapperDiv = $('<div class="calculated-setting-row codemirror-wrapper"></div>'); /*ABK*/
        wrapperDiv.append(datanodeToolbox);
        var codeMirrorMiniEditor = jsEditor.displayMiniJSEditor(wrapperDiv, input.val(), newSettings, function(result) {
            input.val(result);
            input.change();
        });

        wrapperDiv.append(input);
        var jsEditorTool = $(
          '<a>Full Screen view<i class="basic icn-full-screen""></i></a>'
        ).mousedown(function (e) {
          e.preventDefault();
          jsEditor.displayJSEditor(
            input.val(),
            newSettings,
            settingDef,
            settingsSavedCallback,
            function (result) {
              codeMirrorMiniEditor.setValue(result);
              input.val(result);
              input.change();
            }
          );
        });
        datanodeToolbox.append(jsEditorTool);

        if (includeRemove) {
            var removeButton = $('<li class="remove-setting-row"><i class="icon-minus icon"></i><label></label></li>')
                .mousedown(function(e) {
                    e.preventDefault();
                    wrapperDiv.remove();
                    $(valueCell).find('textarea:first').change();
                });
            datanodeToolbox.prepend(removeButton);
        }

        $(valueCell).append(wrapperDiv);
        if (!_.isUndefined(settingDef.description1)) { /*ABK*/
            $(valueCell).append($('<div class="setting-description" style="display:block;">' + settingDef.description1 + '</div>'));
        }
    }

    function saveSettings(selectedType, settings, settingsSavedCallback) {
        $(".validation--error").remove();
        if (newSettings.type === "") {
            newSettings = settings;
        } 
        
        // Loop through each setting and validate it
        for (var index = 0; index < selectedType.settings.length; index++) {
            var settingDef = selectedType.settings[index];

            if (settingDef.required && (_.isUndefined(newSettings.settings[settingDef.name]) || newSettings.settings[settingDef.name] == "")) {
                _displayValidationError(settingDef.name, "This is required.");
                return true;
            } else if (settingDef.type == "integer" && (newSettings.settings[settingDef.name] % 1 !== 0)) {
                _displayValidationError(settingDef.name, "Must be a whole number.");
                return true;
            } else if (settingDef.type == "number" && !_isNumerical(newSettings.settings[settingDef.name])) {
                _displayValidationError(settingDef.name, "Must be a number.");
                return true;
            } else if (settingDef.type == "text" && settingDef.name == "name") { //AEF
                if (newSettings.settings[settingDef.name].indexOf('\\') !== -1) { //MBG avoid bug when settingDef == function
                    _displayValidationError(settingDef.name, "Backslash '\\' is forbidden.");
                    return true;
                }
            }
        }
        if (newSettings.type == 'JSON_var_plugin') { // MBG 12/12/2021
            let json = datanodesManager.getJsonEd();
            json.updateVal();
        }
        if ((newSettings.type == "Map_matching_from_datanode") && (!navigator.onLine)) {
            swal("Need internet connection for '" + newSettings.settings.name + "'", "Please verify your connection then reload the page", "error");
            return false;
        } else {
            if (_.isFunction(settingsSavedCallback)) {
                if (settingsSavedCallback(newSettings) === false)
                    return false;
                else // problem in data name
                    return true;
            }
        }
    }

    var newSettings = {
        type: "",
        iconType: "",
        settings: {}
    };

    function createPluginEditor(pluginTypes, currentTypeName, currentSettingsValues, flag) {
        newSettings = {
            type: currentTypeName,
            iconType: "",
            settings: {}
        };

        function createSettingRow(name, displayName) {
            let tr = $('<div id="setting-row-' + name + '" class="form-row"></div>').appendTo("#data-form-content");
            tr.append('<div class="form-label"><label class="control-label">' + displayName + '</label></div>');
            return $('<div id="setting-value-container-' + name + '" class="form-value"></div>').appendTo(tr);
        }

        function removeRows() {
            let node = $("#data-form-content")[0];
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        }


        function typeSelectChange(val) {
            newSettings.type = val;
            newSettings.settings = {};

            // Remove all the previous settings
            $(".input-wrapper-current").remove();

            selectedType = pluginTypes[val];
            newSettings.iconType = selectedType.icon_type;
            if (!_.isUndefined(selectedType)) {
                var $body = angular.element(document.body);
                var $rootScope = $body.scope().$root;
                $rootScope.dataNodeDescription = selectedType.description;

                if (_.isUndefined(selectedType.preFillBody))
                    createSettingsFromDefinition(selectedType.settings, selectedType.typeahead_source, selectedType.typeahead_data_segment);
                else // AEF: defined for FMI_webservice
                    createSettingsFromDefinition(selectedType.settings, selectedType.typeahead_source, selectedType.typeahead_data_segment, selectedType.preFillBody);
            }
        }

        var selectedType;

        if (!_.isUndefined(flag)) {
            typeSelectChange(flag);
            return;
        }

        function createSettingsFromDefinition(settingsDefs, typeaheadSource, typeaheadDataSegment, preFillBody) {
            removeRows();
            _.each(settingsDefs, function(settingDef) {
                // Set a default value if one doesn't exist
                if (!_.isUndefined(settingDef.default_value) && _.isUndefined(currentSettingsValues[settingDef.name])) {
                    currentSettingsValues[settingDef.name] = settingDef.default_value;
                }
                //AEF: special treatment for prefillBody. Need to reset body value when change typeOfDatasource if last one has prefilled
                if (settingDef.name == "body" && currentSettingsValues.bodyPrefill == true) {
                    if (!_.isUndefined(settingDef.default_value)) {
                        if (currentSettingsValues[settingDef.name] === "") //AEF: do not reset with prefill if body in already filled 
                            currentSettingsValues[settingDef.name] = settingDef.default_value;
                    } else {
                        currentSettingsValues[settingDef.name] = "";
                    }
                }

                var displayName = settingDef.name;

                if (!_.isUndefined(settingDef.display_name)) {
                    displayName = settingDef.display_name;
                }
                var valueCell;
                valueCell = createSettingRow(settingDef.name, displayName);

                switch (settingDef.type) {
                    case "array":
                        {
                            var containerDiv = $('<div style="display:inline-table"></div>').appendTo(valueCell);
                            var subTableDiv = $('<div class="form-table-value-subtable" style="width:80%"></div>').appendTo(containerDiv);

                            var subTable = $('<table class="sub-table"></table>').appendTo(subTableDiv);
                            var subTableHead = $("<thead></thead>").hide().appendTo(subTable);
                            var subTableHeadRow = $("<tr></tr>").appendTo(subTableHead);
                            var subTableBody = $('<tbody></tbody>').appendTo(subTable);

                            var currentSubSettingValues = [];

                            // Create our headers
                            _.each(settingDef.settings, function(subSettingDef) {
                                var subsettingDisplayName = subSettingDef.name;

                                if (!_.isUndefined(subSettingDef.display_name)) {
                                    subsettingDisplayName = subSettingDef.display_name;
                                }

                                $('<th>' + subsettingDisplayName + '</th>').appendTo(subTableHeadRow);
                            });

                            if (settingDef.name in currentSettingsValues) {
                                currentSubSettingValues = currentSettingsValues[settingDef.name];
                            }

                            function processHeaderVisibility() {
                                if (newSettings.settings[settingDef.name].length > 0) {
                                    subTableHead.show();
                                } else {
                                    subTableHead.hide();
                                }
                            }

                            function createSubsettingRow(subsettingValue) {
                                var subsettingRow = $('<tr></tr>').appendTo(subTableBody);

                                //AEF
                                var newSetting = {};
                                var bArrayEmpty = false;
                                //
                                if (!_.isArray(newSettings.settings[settingDef.name])) {
                                    newSettings.settings[settingDef.name] = [];
                                    bArrayEmpty = true; //AEF

                                }
                                var i = newSettings.settings[settingDef.name].length * 2; //AEF
                                newSettings.settings[settingDef.name].push(newSetting);

                                _.each(settingDef.settings, function(subSettingDef) {
                                    var subsettingCol = $('<td></td>').appendTo(subsettingRow);
                                    var subsettingValueString = "";

                                    if (!_.isUndefined(subsettingValue[subSettingDef.name])) {
                                        subsettingValueString = subsettingValue[subSettingDef.name];
                                    }

                                    newSetting[subSettingDef.name] = subsettingValueString;
                                    var inputId = "table-row-value-" + settingDef.name + i;

                                    $('<input id=' + inputId + ' class="table--row-value" type="text">').appendTo(subsettingCol).val(subsettingValueString).change(function() {
                                        newSetting[subSettingDef.name] = $(this).val();
                                    });
                                    //AEF
                                    if (bArrayEmpty) {
                                        $('input#' + inputId)[0].setAttribute("readonly", "readonly");
                                    }
                                    i++;
                                    //
                                });
                                if (!bArrayEmpty) { //AEF
                                    subsettingRow.append($('<td class="table-row-operation"></td>').append($('<ul class="board-toolbar"></ul>').append($('<li></li>').append($('<i class="icon-trash icon"></i>').click(function() {
                                        var subSettingIndex = newSettings.settings[settingDef.name].indexOf(newSetting);
                                        if (subSettingIndex != -1) {
                                            newSettings.settings[settingDef.name].splice(subSettingIndex, 1);
                                            subsettingRow.remove();
                                            processHeaderVisibility();
                                        }
                                    })))));
                                } else {
                                    subsettingRow.append($('<td class="table-row-operation"></td>').append($('<ul class="board-toolbar"></ul>').append($('<li></li>').append($('<i class=" icon"></i>')))));
                                }

                                subTableDiv.scrollTop(subTableDiv[0].scrollHeight);

                                processHeaderVisibility();
                            }

                            /*AEF*/
                            $('<label class="board-toolbar datasource-input-suffix"><i class="fa-plus fa"></i>ADD</label>').appendTo(containerDiv).click(function() {
                                var newSubsettingValue = {};

                                _.each(settingDef.settings, function(subSettingDef) {
                                    newSubsettingValue[subSettingDef.name] = "";
                                });

                                createSubsettingRow(newSubsettingValue);
                            });

                            // Create our rows
                            _.each(currentSubSettingValues, function(currentSubSettingValue, subSettingIndex) {
                                createSubsettingRow(currentSubSettingValue);
                            });
                            //AEF: fill by default empty field, for compatibility with old projects
                            if (currentSubSettingValues.length == 0) {
                                var newSubsettingValue = {};

                                _.each(settingDef.settings, function(subSettingDef) {
                                    newSubsettingValue[subSettingDef.name] = "";
                                });
                                //AEF: force old project to be correct
                                newSettings.settings.req_data_type = "none";
                                $('select#select-option-req_data_type')[0].value = "none";
                                //
                                createSubsettingRow(newSubsettingValue);
                            }
                            break;
                        }
                    case "boolean":
                        {
                            newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

                            let div = $('<div></div>').appendTo(valueCell);
                            var onOffSwitch = $('<div class="onoffswitch" style="display:inline-block"><label class="onoffswitch-label" for="' + settingDef.name + '-onoff"><div class="onoffswitch-inner"><span class="on">YES</span><span class="off">NO</span></div><div class="onoffswitch-switch"></div></label></div>').appendTo(div);

                            var input = $('<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + settingDef.name + '-onoff">').prependTo(onOffSwitch).change(function() {
                                newSettings.settings[settingDef.name] = this.checked;
                            });

                            if (settingDef.name in currentSettingsValues) {
                                input.prop("checked", currentSettingsValues[settingDef.name]);
                            }

                            break;
                        }
                    case "browseText":
                        {
                            newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];
                            newSettings.settings["content"] = currentSettingsValues["content"];

                            var input = $('<input type="text" id="select_file_path" style="float:left"></input><input type="file" style="display: none" id="select_file"></input><label class="board-toolbar datasource-input-suffix"><i class="fa-folder-open fa"></i>Browse...</label>');
                            input.mousedown(function(e) {
                                e.preventDefault();

                                $("#select_file").change(function(e) {
                                    var fakeFilePath = this.value;
                                    var fileName = Path2FileName(fakeFilePath);
                                    $("#select_file_path").val(fileName);

                                    var reader = new FileReader();
                                    reader.addEventListener("load", function(event) {
                                        var textFile = event.target;
                                        text = textFile.result;
                                        newSettings.settings["content"] = text;
                                    });
                                    reader.readAsText(e.target.files[0]);
                                });
                                $("#select_file").trigger("click");
                            });

                            input.appendTo(valueCell).change(function() {
                                newSettings.settings[settingDef.name] = Path2FileName($(this).val());
                            });

                            if (settingDef.name in currentSettingsValues) {
                                var fakeFilePath = currentSettingsValues[settingDef.name];
                                var fileName = Path2FileName(fakeFilePath);
                                $("#select_file_path").val(fileName);
                            }

                            break;
                        }
                    case "browseBinary":
                        {
                            newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];
                            newSettings.settings["content"] = currentSettingsValues["content"];
                            var input = $('<input type="text" id="select_file_path" style="float:left"></input><input type="file" style="display: none" id="select_file"></input><label class="board-toolbar datasource-input-suffix"><i class="fa-folder-open fa"></i>Browse...</label>');
                            input.mousedown(function(e) {
                                e.preventDefault();

                                $("#select_file").change(function(e) {
                                    var fakeFilePath = this.value;
                                    var fileName = Path2FileName(fakeFilePath);
                                    $("#select_file_path").val(fileName);

                                    var reader = new FileReader();
                                    reader.addEventListener("load", function(event) {
                                        const data = event.target.result;
                                        newSettings.settings["content"] = btoa([].reduce.call(new Uint8Array(data), function(p, c) { return p + String.fromCharCode(c); }, ""));
                                    });

                                    reader.readAsArrayBuffer(e.target.files[0]);
                                });
                                $("#select_file").trigger("click");
                            });

                            input.appendTo(valueCell).change(function() {
                                newSettings.settings[settingDef.name] = Path2FileName($(this).val());
                            });

                            if (settingDef.name in currentSettingsValues) {
                                var fakeFilePath = currentSettingsValues[settingDef.name];
                                var fileName = Path2FileName(fakeFilePath);
                                $("#select_file_path").val(fileName);
                            }

                            break;
                        }
                    case "unzip":
                        {
                            newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];
                            newSettings.settings["content"] = currentSettingsValues["content"];

                            var input = $(
                                '<input type="text" id="select_file_path" style="float:left"></input>' +
                                '<input type="file" style="display: none" id="select_file" accept="application/x-zip-compressed"></input>' +
                                '<label class="board-toolbar datasource-input-suffix">' +
                                    '<i class="fa-folder-open fa"></i>Browse...' +
                                "</label>"
                            );
                            input.mousedown(function(event) {
                                event.preventDefault();
                                $("#select_file").change(function(event) {
                                    const file = event.target.files[0];
                                    const fileSize = file.size;
                                    let fileSizeFormat = "";

                                    if (fileSize < 1024) {
                                        fileSizeFormat = `${fileSize} bytes`;
                                    } else if (fileSize >= 1024 && fileSize < 1_048_576) {
                                        fileSizeFormat = `${(fileSize / 1024).toFixed(1)} KB`;
                                    } else if (fileSize >= 1_048_576) {
                                        fileSizeFormat = `${(fileSize / 1_048_576).toFixed(1)} MB`;
                                    }

                                    const result = {
                                        type: file.type,
                                        size: fileSizeFormat,
                                        name: file.name,
                                        content: ""
                                    }

                                    JSZip.loadAsync(file)
                                    .then(
                                        function (zip) {
                                            var promises = [];
                                            var zipContent = [];
                                            const extensionsText = ["txt", "json", "xprjson", "xml", "svg", "html", "css"];
                                            const extensionsBinary = ["xls", "xlsx", "jpg", "jpeg", "png", "tiff", "gif"];
                                            zip.forEach(function (relativePath, zipEntry) {  // zipEntry == zip.files[relativePath]
                                                let fileExtension = relativePath.split('.').pop();
                                                if (extensionsText.includes(fileExtension)) {
                                                    promises.push(
                                                        zipEntry.async('string').then(function (fileData) {
                                                            let content = "";
                                                            if (fileExtension === "json" || fileExtension === "xprjson") {
                                                                content = JSON.parse(fileData, null, 2);
                                                            } else {
                                                                content = fileData;
                                                            }
                                                            zipContent.push({ "name": relativePath, "content": content});
                                                        })
                                                    );
                                                } else if (!fileExtension.includes("/")) {
                                                    promises.push(
                                                        zipEntry.async('uint8array').then(function (fileData) {
                                                            let content = btoa([].reduce.call(new Uint8Array(fileData), function(p, c) { return p + String.fromCharCode(c); }, ""));
                                                            zipContent.push({ "name": relativePath, "content": content});
                                                        })
                                                    );
                                                }
                                            });
                                            Promise.all(promises).then(function() {
                                                result.content = zipContent;
                                                newSettings.settings["content"] = result;
                                            });
                                        },
                                        function (event) {
                                            let notice = new PNotify({
                                                title: "Unzip file",
                                                text: "Error reading " + file.name + ": " + event.message,
                                                type: "error",
                                                styling: "bootstrap3"
                                            });
                                            $('.ui-pnotify-container').on('click', function () {
                                                notice.remove();
                                            });
                                            console.error("Error reading " + file.name + ": " + event.message); 
                                        }
                                    );

                                    var fakeFilePath = this.value;
                                    var fileName = Path2FileName(fakeFilePath);
                                    $("#select_file_path").val(fileName);
                                });
                                $("#select_file").trigger("click");
                            });

                            input.appendTo(valueCell).change(function() {
                                newSettings.settings[settingDef.name] = Path2FileName($(this).val());
                            });

                            if (settingDef.name in currentSettingsValues) {
                                var fakeFilePath = currentSettingsValues[settingDef.name];
                                var fileName = Path2FileName(fakeFilePath);
                                $("#select_file_path").val(fileName);
                            }

                            break;
                        }
                    case "json":
                        {
                            newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];
                            newSettings.settings['content'] = currentSettingsValues['content'];
                            if (_.isUndefined($('#var-body')[0])) {
                                var input = $('<input type="text" title="' + settingDef.display_name + '" class="input__wrapper--text" id="var-body" autocorrect="off" autocomplete="off" spellcheck="false" />');
                                input.appendTo(valueCell).change(function() {
                                    newSettings.settings[settingDef.name] = $(this).val();
                                    let jsonEd = datanodesManager.getJsonEditor();
                                    let json = datanodesManager.getJsonEd();
                                    json.updateEditor(jsonEd, $(this).val());
                                });

                                $('<div class="btn-wrapper btn-wrapper--no-label input-wrapper-current" id="btn-json">').appendTo($("#data-form-content"));
                                $('<div class="tree__preview__container input-wrapper-current" style="height:unset"><div id="full-screen-json" class="tree__preview__container--top"><a><p>Full Screen view</p><i class="basic icn-full-screen"></i></a></div><div id="tree-preview" style="height: 36vh;"></div></div>').appendTo($("#data-form-content"));
                                $("#full-screen-json").on('click', function() {
                                    var elem = document.getElementById("tree-preview");
                                    if (elem.requestFullscreen) {
                                        elem.requestFullscreen();
                                    } else if (elem.webkitRequestFullscreen) { /* Safari */
                                        elem.webkitRequestFullscreen();
                                    } else if (elem.msRequestFullscreen) { /* IE11 */
                                        elem.msRequestFullscreen();
                                    }
                                });
                                var json = datanodesManager.getJsonEd();

                                json.displayJSONEdit(input.val(), function(result) {
                                    input.val(result);
                                    input.change();
                                });
                            }
                            if (settingDef.name in currentSettingsValues) {
                                $("#var-body").val(currentSettingsValues[settingDef.name]);
                                let jsonEd = datanodesManager.getJsonEditor();
                                let json = datanodesManager.getJsonEd();
                                json.updateEditor(jsonEd, currentSettingsValues[settingDef.name]);
                            }
                            break;
                        }
                    case "option":
                        {
                            var defaultValue = currentSettingsValues[settingDef.name];
                            var selectId = "select-option-" + settingDef.name;
                            var input = $('<select id="' + selectId + '"></select>').appendTo($('<div class="styled-select"></div>').appendTo(valueCell)).change(function() {
                                newSettings.settings[settingDef.name] = $(this).val();

                                //AEF
                                if ((settingDef.name === "FMI_webservice" && newSettings.settings.bodyPrefill) || (settingDef.name === "req_data_type")) {
                                    preFillBody(); //defined by default for FMI_webservice and REST_webservices
                                }
                            });

                            _.each(settingDef.options, function(option) {
                                var optionName;
                                var optionValue;

                                if (_.isObject(option)) {
                                    optionName = option.name;
                                    optionValue = option.value;
                                } else {
                                    optionName = option;
                                }

                                if (_.isUndefined(optionValue)) {
                                    optionValue = optionName;
                                }

                                if (_.isUndefined(defaultValue)) {
                                    defaultValue = optionValue;
                                }

                                $("<option></option>").text(optionName).attr("value", optionValue).appendTo(input);
                            });

                            newSettings.settings[settingDef.name] = defaultValue;
                            if (settingDef.name in currentSettingsValues) {
                                input.val(currentSettingsValues[settingDef.name]);
                            }
                            break;
                        }
                    case "custom1":
                    case "custom2":
                        {
                            newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];
                            settingDef.implementation(valueCell, settingDef, currentSettingsValues, newSettings);
                            break;
                        }
                    default:
                        {
                            var input;
                            newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

                            if (settingDef.type == "calculated") {
                                if (settingDef.name in currentSettingsValues) {
                                    var currentValue = currentSettingsValues[settingDef.name];
                                    if (settingDef.multi_input && _.isArray(currentValue)) {
                                        var includeRemove = false;
                                        for (var i = 0; i < currentValue.length; i++) {
                                            _appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue[i], includeRemove);
                                            includeRemove = true;
                                        }
                                    } else {
                                        _appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue, false);
                                    }
                                } else {
                                    _appendCalculatedSettingRow(valueCell, newSettings, settingDef, null, false, );
                                }

                                if (settingDef.multi_input) {
                                    var inputAdder = $('<ul class="board-toolbar"><li class="add-setting-row"><i class="fa-plus fa"></i><label>ADD</label></li></ul>')
                                        .mousedown(function(e) {
                                            e.preventDefault();
                                            _appendCalculatedSettingRow(valueCell, newSettings, settingDef, null, true);
                                        });
                                    $(valueCell).siblings('.form-label').append(inputAdder);
                                }
                            } else {
                                input = $('<input type="text" title="' + settingDef.display_name + '" class="input__wrapper--text" />').appendTo(valueCell).change(function() {
                                    if (settingDef.name == "name") { //ABK limit datanode name length
                                        $('<input type="text">')[0].maxLength = 40;
                                    }
                                    if (settingDef.type == "number") {
                                        newSettings.settings[settingDef.name] = Number($(this).val());
                                    } else {
                                        //ABK
                                        var bFoundConnection = false;
                                        var prop = "";
                                        for (var prop in widgetConnector.widgetsConnection) {
                                            for (var i in widgetConnector.widgetsConnection[prop].sliders) {
                                                if (widgetConnector.widgetsConnection[prop].sliders[i].name != "None") {
                                                    if (!_.isUndefined(widgetConnector.widgetsConnection[prop].sliders[i].connectedDataNodeS)) { // MBG security
                                                        if (widgetConnector.widgetsConnection[prop].sliders[i].connectedDataNodeS === newSettings.settings[settingDef.name]) {
                                                            bFoundConnection = true;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                            if (bFoundConnection)
                                                break;
                                        }
                                        if (bFoundConnection) {
                                            swal("'" + newSettings.settings[settingDef.name] + "' is now missing", "Connections with widget '" + widgetConnector.widgetsConnection[prop].modelJsonId + "' may be removed!", "warning");
                                        }
                                        //
                                        newSettings.settings[settingDef.name] = $(this).val();
                                    }
                                });

                                if (settingDef.name in currentSettingsValues) {
                                    input.val(currentSettingsValues[settingDef.name]);
                                }

                                if (typeaheadSource && settingDef.typeahead_data_field) {
                                    input.addClass('typeahead_data_field-' + settingDef.typeahead_data_field);
                                }

                                if (typeaheadSource && settingDef.typeahead_field) {
                                    var typeaheadValues = [];

                                    input.keyup(function(event) {
                                        if (event.which >= 65 && event.which <= 91) {
                                            input.trigger('change');
                                        }
                                    });
                                    $(input).autocomplete({
                                        source: typeaheadValues,
                                        select: function(event, ui) {
                                            input.val(ui.item.value);
                                            input.trigger('change');
                                        }
                                    });

                                    input.change(function(event) {
                                        var value = input.val();
                                        var source = _.template(typeaheadSource)({ input: value });
                                        $.get(source, function(data) {
                                            if (typeaheadDataSegment) {
                                                data = data[typeaheadDataSegment];
                                            }
                                            data = _.select(data, function(elm) {
                                                return elm[settingDef.typeahead_field][0] == value[0];
                                            });

                                            typeaheadValues = _.map(data, function(elm) {
                                                return elm[settingDef.typeahead_field];
                                            });
                                            $(input).autocomplete("option", "source", typeaheadValues);

                                            if (data.length == 1) {
                                                data = data[0];
                                                //we found the one. let's use it to populate the other info
                                                for (var field in data) {
                                                    if (data.hasOwnProperty(field)) {
                                                        var otherInput = $(_.template('input.typeahead_data_field-<%= field %>')({ field: field }));
                                                        if (otherInput) {
                                                            otherInput.val(data[field]);
                                                            if (otherInput.val() != input.val()) {
                                                                otherInput.trigger('change');
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                    });
                                }
                            }
                            break;
                        }
                }

                if (!_.isUndefined(settingDef.suffix)) {
                    valueCell.append($('<div class="input--suffix">' + settingDef.suffix + '</div>'));
                }

                if (!_.isUndefined(settingDef.description)) {
                    valueCell.append($('<div class="setting-description">' + settingDef.description + '</div>'));
                }
            });
        }

        // Create data-list plugins

        //AEF add groups for clarity
        var labels = [
            //order is important
            { name: "JSON", searchString: ["Variable"] },
            { name: "Python", searchString: ["Pyodide"] },
            { name: "JavaScript", searchString: ["client-side"] },
            { name: "APIs", searchString: ["REST"] },
            { name: "Files", searchString: ["Generic", "CSV file", "Unzip"], },
            { name: "Streams & Real-time", searchString: ["Clock", "Delay", "WebSocket", "MQTT", "Geoloc"], },
            { name: "Others", searchString: "" },
        ];

        var typeOptGp = [];
        for (var i = 0; i < labels.length; i++) {
            typeOptGp[labels[i].name] = [];
        }
        //
        _.each(pluginTypes, function(pluginType) {
            //AEF add groups for clarity
            var index = labels.length - 1;
            for (var i = 0; i < labels.length; i++) {
                var bFound = false;
                for (var j = 0; j < labels[i].searchString.length; j++) {
                    if (pluginType.display_name.search(labels[i].searchString[j]) != -1) {
                        index = i;
                        bFound = true;
                        break;
                    }
                }
                if (bFound)
                    break;
            }
            //AEF: new display
            typeOptGp[labels[index].name].push({ 'name': pluginType.display_name, 'type': pluginType.type_name });

        });

        //AEF: new display
        if ($('#datanode-list')[0].childNodes.length == 1) { //add plugin once
            $('#datanode-list')[0].innerHTML = '';
            $('<div class="panel--content--top"><h1>New</h1><button ng-click="editorView.newDatanodePanel.view=!editorView.newDatanodePanel.view" class="btn btn-icon-only"><i class="basic icn-miniarrowleft"></i></button></div>').appendTo($('#datanode-list'));
            for (let i = 0; i < labels.length; i++) {
                if (typeOptGp[labels[i].name].length > 0) {
                    var datanodeWrap = $('<div class="add__new__datanode--list--wrap"></div>').appendTo($('#datanode-list'));
                    $("<span>" + labels[i].name + "</span>").appendTo(datanodeWrap);
                    let ul = $('<ul></ul>').appendTo(datanodeWrap);

                    for (let j = 0; j < typeOptGp[labels[i].name].length; j++) {
                        a = $('<a title="Open ' + labels[i].name + ' : ' + typeOptGp[labels[i].name][j].name + ' dataNode" ng-click="openDataNodeTypePlugin(\'' + typeOptGp[labels[i].name][j].type + '\')"></a>').appendTo($('<li></li>').appendTo(ul));
                        a.text(typeOptGp[labels[i].name][j].name);
                        $('<i class="basic icn-miniarrowright"></i>').appendTo(a);
                    }
                }
            }
            var $body = angular.element(document.body); // 1
            var $rootScope = $body.scope().$root;
            $rootScope.myDataNodeHTML = $('#datanode-list').html();
        }
    }

    // Public API
    return {
        createPluginEditor: function(pluginTypes, currentTypeName, currentSettingsValues, flag) {
            createPluginEditor(pluginTypes, currentTypeName, currentSettingsValues, flag);
        },
        getNewSettings: function() {
            return newSettings;
        },
        saveSettings: function(selectedType, settings, settingsSavedCallback) {
            return saveSettings(selectedType, settings, settingsSavedCallback);
        }
    };
};
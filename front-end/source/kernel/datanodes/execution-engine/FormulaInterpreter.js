// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ FormulaInterpreter                                                 │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function FormulaInterpreter(datanodesListModel, datanodeModel, datanodePlugins, datanodesDependency) {
  var self = this;
  self.bCalculatedSettings = true;

  /*--------callValueFunction--------*/
  this.callValueFunction = function (theFunction) {
    // MBG question : datanodesListModel.datasourceData : why is this in datanodesListModel??
    return theFunction.call(undefined, datanodesListModel.datasourceData);
  };

  /*--------processCalculatedSetting--------*/
  this.processCalculatedSetting = function (settingName, script) {
    //AEF: parse error line by line to have more info for notification
    var bError = false;
    let lines = script.split('\n');
    for (let i = 0; i < lines.length; i++) {
      var datanodeRegex = new RegExp(
        'dataNodes.([\\w\\-]{1,}\\.{0,}[\\w\\-]{0,})|dataNodes\\[[\'"]([\\w\\\\\\-]{1,})[\'"]\\]((\\[[\'"]([\\w\\W]){1,}[\'"](?=\\])\\])){0,1}',
        'g'
      );
      while ((matches = datanodeRegex.exec(lines[i]))) {
        // find all datanodes in line i
        let dsName;
        let dsEval;
        if (!_.isUndefined(matches[1])) {
          //case of datanodes.name.param1...
          dsName = matches[1].split('.')[0];
          dsEval = matches[0];
        } else {
          //case of datanodes["name"]["param1"]...
          dsName = matches[2].split('"]')[0];
          dsEval = matches[0];
          let count = 1;
          let nbTimes = matches[0].split('"]').length - 1;

          if (nbTimes > 2) {
            for (let k = 0; k < nbTimes - 2; k++) {
              dsEval = matches[0].substring(0, matches[0].length - count);
              count++;
              while (!dsEval.endsWith('"]', dsEval.length)) {
                //remove characters after last ']', because "param1" can be like "toto tata [r]"
                dsEval = matches[0].substring(0, matches[0].length - count);
                count++;
              }
            }
          }
        }

        try {
          let valueFct = new Function('dataNodes', dsEval);
          self.callValueFunction(valueFct);
        } catch (e) {
          datanodeModel.statusCallback('Error', e.message);
          const text = 'var ' + dsName + ' in line ' + i + ' : ' + e.message;
          datanodeModel.notificationCallback(
            'error',
            datanodeModel.settings().name,
            text,
            "Error evaluation at datanode : '" + datanodeModel.name() + "'"
          );
          bError = true;
          self.bCalculatedSettings = false;
        }
      }
    }

    if (!bError && _.isFunction(datanodeModel.calculatedSettingScripts[settingName])) {
      let returnValue;
      try {
        returnValue = self.callValueFunction(datanodeModel.calculatedSettingScripts[settingName]);
      } catch (e) {
        datanodeModel.statusCallback('Error', e.message);
        datanodeModel.notificationCallback('error', datanodeModel.settings().name, e.message, 'Parse error');
        returnValue = null;
        self.bCalculatedSettings = false;
      }
      if (
        !_.isUndefined(datanodeModel.datanodeInstance) &&
        _.isFunction(datanodeModel.datanodeInstance.onCalculatedValueChanged)
      ) {
        if (!_.isEmpty(script)) {
          if (_.isUndefined(returnValue)) {
            const text = "Parse error while parsing formula in : '" + datanodeModel.name() + "'";
            datanodeModel.notificationCallback('warning', datanodeModel.settings().name, text, 'Parse error');
            datanodeModel.statusCallback('Error', 'Parse error');
            try {
              datanodeModel.datanodeInstance.onCalculatedValueChanged(settingName, undefined); //AEF this line is needed to update datanode value
            } catch (e) {
              console.log(e.toString());
            }
          } else if (!_.isNull(returnValue)) {
            const lastNotif = true;
            const text = "Success while parsing formula in : '" + datanodeModel.name() + "'";
            datanodeModel.notificationCallback(
              'success',
              datanodeModel.settings().name,
              text,
              'Parse success',
              lastNotif
            );
            try {
              datanodeModel.datanodeInstance.onCalculatedValueChanged(settingName, returnValue);
            } catch (e) {
              console.log(e.toString());
            }
          }
        } else {
          //console.log("returnValue is undefined because script is empty"); //AEF
        }
      } else {
        console.log('datanodeInstance or onCalculatedValueChanged function is not defined');
      }
    }
    return true;
  };

  /*--------updateCalculatedSettings--------*/
  this.updateCalculatedSettings = function (bProjectLoad, bAllPredExecuted) {
    self.bCalculatedSettings = true;
    datanodeModel.datanodeRefreshNotifications = {};
    datanodeModel.calculatedSettingScripts = {};
    if (_.isUndefined(datanodeModel.type())) {
      return false;
    }

    // Check for any calculated settings
    var settingsDefs = datanodePlugins[datanodeModel.type()].settings;
    var datanodeRegex = new RegExp('dataNodes.([\\w_-]+)|dataNodes\\[[\'"]([^\'"]+)', 'g');
    const regexPython = /(?=["'])(?:"[^"\\]*(?:\\[\s\S][^"\\]*)*"|'[^'\\]*(?:\\[\s\S][^'\\]*)*')|(#.*$)/gm;
    var currentSettings = datanodeModel.settings();
    var bOK = true;
    _.each(settingsDefs, function (settingDef) {
      if (settingDef.type == 'calculated' || settingDef.type == 'custom2') {
        var script = currentSettings[settingDef.name];
        if (!_.isUndefined(script)) {
          if (settingDef.type == 'custom2') {
            // The substituted value will be contained in the result variable
            script = script.replace(regexPython, function (m, group1) {
              if (group1 == null) return m;
              else return '';
            });
          } else {
            script = script.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1'); //AEF: to remove comments from script
          }
          // MBG 25/10/2021 : enlever les \n faits perdre des infos sur les blocs de code. A garder
          // script = script.replaceAll('\n', ""); //AEF: remove first empty line after removing comments
          script = script.replace(/datasources/g, 'dataNodes');
          script = script.replace(/headersFromDatasourceWS/g, 'headersFromDataNodeWS');
          if (_.isArray(script)) {
            script = '[' + script.join(',') + ']';
          }

          // If there is no return, add one
          if ((script.match(/;/g) || []).length <= 1 && script.indexOf('return') == -1) {
            if (!_.isEmpty(script)) script = 'return ' + script;
            else {
              if (!_.isUndefined(datanodeModel.settings().method)) {
                if (datanodeModel.settings().method == 'POST') {
                  const text = 'Cannot have an empty body with a POST method';
                  datanodeModel.notificationCallback(
                    'warning',
                    currentSettings.name,
                    text,
                    "Cannot have an empty body with a POST method in datanode : '" + datanodeModel.name() + "'"
                  );
                }
              }
            }
          }

          let valueFunction;

          if (settingDef.type != 'custom2') {
            try {
              valueFunction = new Function('dataNodes', script);
            } catch (e) {
              const text = e + '.\n Formula interpreted as literal text';
              datanodeModel.notificationCallback(
                'warning',
                currentSettings.name,
                text,
                "Syntax error at datanode : '" + datanodeModel.name() + "'"
              );

              // bOK = false;
              // return; // MBG to uncomment if no parse error tolerance is required
              const literalText = currentSettings[settingDef.name].replace(/"/g, '\\"').replace(/[\r\n]/g, ' \\\n');
              // If the value function cannot be created, then go ahead and treat it as literal text
              valueFunction = new Function('dataNodes', 'return "' + literalText + '";');
            }
          }

          let matches;
          let allDsNames = new Set();

          while ((matches = datanodeRegex.exec(script))) {
            const dsName = matches[1] || matches[2];

            if (datanodeModel.name() === dsName) {
              //AEF: loop detected before adding the datanode (at creation)
              const text =
                'DataNode "' +
                dsName +
                '": Please remove from formula the expression dataNodes["' +
                datanodeModel.name() +
                '"].';
              datanodeModel.statusCallback('Error');
              swal('Loop detection', text, 'error');
              self.bCalculatedSettings = false;
              bOK = false;
              return;
            }

            if (!datanodesDependency.isNode(dsName)) {
              datanodesDependency.addNode(dsName);
            }
            datanodesDependency.addEdge(dsName, datanodeModel.name());
            allDsNames.add(dsName);

            if (!bProjectLoad) {
              //AEF: this part of code will be executed by scheduler not at instance creation
              if (!datanodesManager.foundDatanode(dsName)) {
                //AEF: here data doesn't exist, different from data is undefined (e.g. in webservice)
                const text = "DataNode '" + dsName + "' does not exist in dataNodes list";
                datanodeModel.statusCallback('Error', text);
                datanodeModel.notificationCallback('error', datanodeModel.name(), text, 'Error in formula');
                self.bCalculatedSettings = false;
                return;
              }
            }
            //AEF: this part is executed before scheduler, at instance creation to unauthorize cycles from the begining
            const cyclesDetection = datanodesDependency.detectCycles();
            const text = '';
            if (cyclesDetection.hasCycle) {
              datanodesDependency.removeEdge(dsName, datanodeModel.name());
              text =
                'Cycle detected while computing dataNode "' +
                dsName +
                '" while parsing formula in : "' +
                datanodeModel.name() +
                '"';
              datanodeModel.statusCallback('Error');
              swal('Cycle detection', text, 'error'); //AEF considered as error because it is not possible for scheduler
              self.bCalculatedSettings = false;
              bOK = false;
              return;
            }

            //AEF: Should we keep this code here?
            let refreshSettingNames = datanodeModel.datanodeRefreshNotifications[dsName];
            if (_.isUndefined(refreshSettingNames)) {
              refreshSettingNames = [];
              datanodeModel.datanodeRefreshNotifications[dsName] = refreshSettingNames;
            }
            if (_.indexOf(refreshSettingNames, settingDef.name) == -1) {
              // Only subscribe to this notification once.
              refreshSettingNames.push(settingDef.name);
            }
          }

          //AEF: fix bug (clean up data that doesn't exist anymore in formula for example)
          datanodesDependency.removeMissedDependantDatanodes(allDsNames, datanodeModel.name());

          // MBG moved
          if (settingDef.type != 'custom2') {
            datanodeModel.calculatedSettingScripts[settingDef.name] = valueFunction;
            if (bAllPredExecuted) {
              if (!self.processCalculatedSetting(settingDef.name, script)) {
                self.bCalculatedSettings = false;
                bOK = false;
                return;
              }
            }
          }
        } else {
          //console.log("script is undefined");
        }
      }
    });
    return bOK;
  };
}

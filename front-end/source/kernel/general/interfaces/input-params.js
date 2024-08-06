// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ inputHandler                                                       │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

export const inputHandler = (function () {
  /*--------patchInputVariables--------*/
  function patchInputVariables(jsonContent, projectQueryParams) {
    _.each(projectQueryParams, (parVal) => {
      jsonContent = patchVariableDataNode(jsonContent, parVal.dsName, parVal.dsVal);
    });
    return jsonContent;
  }

  /*--------patchVariableDataNode--------*/
  function patchVariableDataNode(jsonContent, dsName, dsVal) {
    let bFound = false;

    for (var i = 0; i < jsonContent.data.datanodes.length; i++) {
      if (jsonContent.data.datanodes[i].name == dsName) {
        bFound = true;
        if (jsonContent.data.datanodes[i].type == 'JSON_var_plugin') {
          jsonContent.data.datanodes[i].settings.json_var = JSON.stringify(dsVal);
        } else {
          console.log('patchVariableDataNode failed : dataNode ' + dsName + '  is not a variable');
        }
      }
    }
    if (!bFound) console.log('patchVariableDataNode failed : unable to find dataNode ' + dsName);
    return jsonContent;
  }

  /*--------encodeInputPars--------*/
  function encodeInputPars(projectQueryParams) {
    return btoa(JSON.stringify(projectQueryParams));
  }

  /*--------decodeInputPars--------*/
  function decodeInputPars(projectQueryParams) {
    try {
      let dp = JSON.parse(atob(projectQueryParams));
      return dp;
    } catch (ex) {
      console.log(ex);
      return null;
    }
  }
  return { encodeInputPars, decodeInputPars, patchInputVariables };
})();

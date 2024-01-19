JSEditorCompletion = (function () {
  const VALUE_LENGTH = 75;

  // Returns the length of the last group of a datanode's path
  function getPrecedingPathLength(line, pos) {
    const preCursor = line.substring(0, pos);
    let match;
    if ((match = /^.*(\s*\[\s*(?:[0-9]+|(["'])(?:(?=(\\?))\3.)*?)\2\s*\]\s*)$/.exec(preCursor))) {
      let result = match[1].length;
      const ds = 'dataNodes';
      if (line.substring(0, pos - result).endsWith(ds)) {
        result += ds.length;
      }
      return result;
    }
    return undefined;
  }

  // Returns the CodeMirror completion function for an array of datanodes.
  function createCompletionFct(datanodes) {
    return function completionFct(cm, option) {
      if (!datanodes || datanodes.length === 0) {
        return undefined;
      }

      const cursor = cm.getCursor();
      const lineNb = cursor.line;
      const line = cm.getLine(lineNb);
      const pos = cursor.ch;

      const result = _complete(datanodes, line, pos);
      if (result) {
        // This is done so that _complete does not depend on CodeMirror
        result.from = CodeMirror.Pos(lineNb, result.from);
        result.to = CodeMirror.Pos(lineNb, result.to);
      }
      return result;
    };
  }

  function _complete(datanodes, line, pos) {
    const prevDs = _locateDataNodes(line, pos, true);
    if (prevDs) {
      if (pos < prevDs.end) {
        // TODO use name as prefix ?
        return _createDatanodesChoices(datanodes, prevDs.start, prevDs.end);
      } else {
        const pathObj = _locatePath(line, prevDs.end, pos);
        if (pathObj) {
          const data = _getDsData(datanodes, prevDs.name);
          if (data) {
            const leaf = _resolvePath(data, pathObj.path);

            let list = [];
            if (Array.isArray(leaf)) {
              list = [...leaf.keys()].map((i) => _createProposal(`[${i}]`, leaf[i]));
            } else if ((typeof leaf === 'object' || typeof leaf === 'function') && leaf !== null) {
              list = Object.keys(leaf).map((s) => _createProposal(`[${_quoteString(s)}]`, leaf[s]));
            }
            return {
              list,
              from: pathObj.completionStart,
              to: pathObj.completionEnd,
            };
          } else {
            return undefined;
          }
        }
      }
    }

    const prefixDs = _locateDataNodesPrefix(line, pos);
    if (prefixDs) {
      const filteredDs = datanodes.filter((ds) => ds.name().startsWith(prefixDs.prefix));
      const presentedDs = filteredDs.length > 0 ? filteredDs : datanodes;
      return _createDatanodesChoices(presentedDs, prefixDs.start, prefixDs.end);
    }

    const before = line.substring(0, pos);
    const match = /(?<=[^\w]|^)d(?:a(?:t(?:a(?:N(?:o(?:d(?:es?)?)?)?)?)?)?)?$/.exec(before);
    if (match) {
      // typing 'dataNodes'
      return _createDatanodesChoices(datanodes, match.index, pos);
    } else {
      // Anywhere else
      return _createDatanodesChoices(datanodes, pos);
    }
  }

  // returns "str", with appropriate escape characters to be a valid JS string
  function _quoteString(str) {
    return JSON.stringify(str);
  }

  /*
   * Create the completion object for codemirror listing all the provided datanodes.
   * datanodes: Freeboard datanodes array
   * from: Start of the zone to replace with the completion choice.
   * to: End of the zone to replace with the completion choice. Optional, defaults to 'from'.
   */
  function _createDatanodesChoices(datanodes, from, to) {
    if (to === undefined) {
      to = from;
    }

    return {
      list: datanodes.map((ds) => _createProposal(`dataNodes[${_quoteString(ds.name())}]`, ds.latestData())),
      from,
      to,
    };
  }

  /*
   * Creates one codemirror completion proposal, with pretty HTML formating.
   * text: completion text that will be inserted into the editor
   * value: optional value extracted from the datanode
   */
  function _createProposal(text, value) {
    return {
      text,
      render: function (elt, data, cur) {
        const wrapper = document.createElement('div');
        const textElt = document.createElement('b');
        textElt.innerText = text;
        wrapper.appendChild(textElt);

        if (value !== undefined) {
          const dashElt = document.createElement('span');
          dashElt.innerText = ' - ';
          wrapper.appendChild(dashElt);

          const valueElt = document.createElement('i');
          valueElt.innerText = _valueToText(value, VALUE_LENGTH);
          wrapper.appendChild(valueElt);
        }

        elt.appendChild(wrapper);
      },
    };
  }

  // Converts a JSON value into text to be shown to the user, with additional dots if too long.
  function _valueToText(value, maxLength = VALUE_LENGTH) {
    let valueText = JSON.stringify(value);
    if (valueText.length > maxLength) {
      let dots;
      if (Array.isArray(value)) {
        dots = '...]';
      } else if ((typeof value === 'object' || typeof value === 'function') && value !== null) {
        dots = '...}';
      } else if (typeof value === 'string' || value instanceof String) {
        dots = '..."';
      } else {
        dots = '...';
      }
      valueText = valueText.substr(0, maxLength - dots.length) + dots;
    }
    return valueText;
  }

  // Check if the cursor is in or at the end of a 'datanodes["xyz"]'
  function _locateDataNodes(line, pos, returnLast = false) {
    const dsRegex = /dataNodes\s*\[\s*(["'])((?:(?=(\\?))\3.)*?)\1\s*\]/g;
    let match, lastMatch;
    while ((match = dsRegex.exec(line))) {
      const text = match[0];
      const start = match.index;
      const end = start + text.length;

      lastMatch = {
        name: _unescape(match[2]),
        start,
        end,
      };

      if (pos >= start && pos <= end) {
        return lastMatch;
      }
    }

    if (returnLast && lastMatch && lastMatch.end <= pos) {
      return lastMatch;
    } else {
      return undefined;
    }
  }

  // Check if the cursor is completing a name, at the end of a 'datanodes["sothin'
  function _locateDataNodesPrefix(line, pos) {
    const toCursor = line.substring(0, pos);
    // Will miss edge cases that are unlikely for a prefix, so should be fine enough
    const dsRegex = /dataNodes\s*\[\s*["']([^"']*)/g;
    let match;
    while ((match = dsRegex.exec(toCursor))) {
      const text = match[0];
      const start = match.index;
      const end = start + text.length;

      if (end === pos) {
        return {
          prefix: match[1],
          start,
          end,
        };
      }
    }

    return undefined;
  }

  // Replaces escape sequences by their values
  // str: string representation without quotes.
  function _unescape(str) {
    if (str) {
      let result = '';
      let escaped = false;
      for (let c of str) {
        if (escaped) {
          escaped = false;
          if (c === 'b') {
            result += '\b';
          } else if (c === 'f') {
            result += '\f';
          } else if (c === 'n') {
            result += '\n';
          } else if (c === 'r') {
            result += '\r';
          } else if (c === 't') {
            result += '\t';
          } else if (c === 'v') {
            result += '\v';
          } else {
            //probably:  c==="\\" ||c==="'" ||c==="\""
            result += c;
          }
        } else {
          if (c === '\\') {
            escaped = true;
          } else {
            result += c;
          }
        }
      }
      return result;
    } else {
      return str;
    }
  }

  // parse the path elements after a datanode and find how far they go
  // text: remaing text after the datanode
  function _decodePath(text) {
    const bracketsRegex = /^\s*\[\s*(?:([0-9]+)|(["'])((?:(?=(\\?))\4.)*?)\2)\s*\]/;
    const path = [];
    let length = 0;
    let match;
    while ((match = bracketsRegex.exec(text))) {
      if (match[1]) {
        // Number
        try {
          path.push(parseInt(match[1], 10));
        } catch (e) {
          // Should not be possible
          console.error(`Invalid number '${match[1]}' in path '${text}'`);
          return undefined;
        }
      } else if (match[3]) {
        // string
        // JSON.parse not useable to support single quotes.
        path.push(_unescape(match[3]));
      } else {
        // Should not be possible
        console.error(`No matched group in match '${match[0]}' in path '${text}'`);
        return undefined;
      }

      const matchedText = match[0];
      length += matchedText.length;
      text = text.substring(matchedText.length);
    }

    return {
      path,
      length,
    };
  }

  /*
   * Parse the path elements after a datanode. Returns undefined if the cursor is not at the end of the path. Also returns the range to replace when completing.
   * line: code line bein parsed
   * dsEnd: end index of the datanode. where the search starts.
   * cursorPos: index of the cursor. where the search ends.
   */
  function _locatePath(line, dsEnd, cursorPos) {
    const postDs = line.substring(dsEnd, cursorPos);
    const pathObj = _decodePath(postDs);
    if (pathObj) {
      const pathLength = pathObj.length;
      const completionStart = dsEnd + pathLength;
      const postPath = postDs.substr(pathLength);
      let match;
      if ((match = /^\s*(?:\[\s*(?:["']\s*)?)?$/.exec(postPath))) {
        return {
          completionStart,
          completionEnd: completionStart + match[0].length,
          path: pathObj.path,
        };
      }
    }

    return undefined;
  }

  // Find a datanode from its name
  function _getDsData(datanodes, name) {
    const ds = datanodes.find((it) => it.name() === name);
    return ds ? ds.latestData() : undefined;
  }

  /*
   * data: some JSON data
   * path: array of string and numbers
   */
  function _resolvePath(data, path) {
    let leaf = data;
    for (let step of path) {
      if (leaf === undefined || leaf === null || typeof leaf === 'string' || leaf instanceof String) {
        return undefined;
      }

      leaf = leaf[step];
    }
    return leaf;
  }

  return {
    getPrecedingPathLength: getPrecedingPathLength,
    createCompletionFct: createCompletionFct,

    // Exported for unit tests
    _locateDataNodes: _locateDataNodes,
    _locateDataNodesPrefix: _locateDataNodesPrefix,
    _decodePath: _decodePath,
    _locatePath: _locatePath,
    _getDsData: _getDsData,
    _resolvePath: _resolvePath,
    _quoteString: _quoteString,
    _valueToText: _valueToText,
    _complete: _complete,
  };
})();

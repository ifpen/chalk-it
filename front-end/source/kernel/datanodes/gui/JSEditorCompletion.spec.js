require('./JSEditorCompletion.js');

var assert = require('assert');

describe('JSEditorCompletion', function () {
  function _pseudoDs(name, data) {
    return {
      name: () => name,
      latestData: () => data,
    };
  }

  describe('locateDataNodes', function () {
    describe('Basics', function () {
      it('should return undefined for the empty string', function () {
        const result = JSEditorCompletion._locateDataNodes('', 0);
        assert.deepStrictEqual(result, undefined);
      });

      it('should return undefined for "xyz"', function () {
        const result = JSEditorCompletion._locateDataNodes('xyz', 1);
        assert.deepStrictEqual(result, undefined);
      });

      // Test both types of quotes
      it('should match for \'dataNodes["xyz"]\'', function () {
        const result = JSEditorCompletion._locateDataNodes('dataNodes["xyz"]', 1);
        assert.deepStrictEqual(result, { name: 'xyz', start: 0, end: 16 });
      });

      it("should match for 'dataNodes['xyz']'", function () {
        const result = JSEditorCompletion._locateDataNodes("dataNodes['xyz']", 1);
        assert.deepStrictEqual(result, { name: 'xyz', start: 0, end: 16 });
      });
    });

    describe('returnLastOpt', function () {
      it('should match after \'ddd dd dataNodes["xyz"]     \'', function () {
        const result = JSEditorCompletion._locateDataNodes('\'ddd dd dataNodes["xyz"]     \'', 29, true);
        assert.deepStrictEqual(result, { name: 'xyz', start: 8, end: 24 });
      });

      it('should not match before \'ddd dd dataNodes["xyz"]     \'', function () {
        const result = JSEditorCompletion._locateDataNodes('\'ddd dd dataNodes["xyz"]     \'', 3, true);
        assert.deepStrictEqual(result, undefined);
      });
    });

    describe('Cursor position', function () {
      it('should return undefined for " + dataNodes[\'xyz\'] + " when cursor before the start', function () {
        const result = JSEditorCompletion._locateDataNodes(" + dataNodes['xyz'] + ", 2);
        assert.deepStrictEqual(result, undefined);
      });

      it('should return undefined for " + dataNodes[\'xyz\'] + " when cursor after the end', function () {
        const result = JSEditorCompletion._locateDataNodes(" + dataNodes['xyz'] + ", 22);
        assert.deepStrictEqual(result, undefined);
      });

      it('should match for " + dataNodes[\'xyz\'] + " when cursor at the start', function () {
        const result = JSEditorCompletion._locateDataNodes(" + dataNodes['xyz'] + ", 3);
        assert.deepStrictEqual(result, { name: 'xyz', start: 3, end: 19 });
      });

      it('should match for " + dataNodes[\'xyz\'] + " when cursor at the end', function () {
        const result = JSEditorCompletion._locateDataNodes(" + dataNodes['xyz'] + ", 19);
        assert.deepStrictEqual(result, { name: 'xyz', start: 3, end: 19 });
      });

      it('should match for " + dataNodes[\'xyz\'] + " when cursor in the middle', function () {
        const result = JSEditorCompletion._locateDataNodes(" + dataNodes['xyz'] + ", 8);
        assert.deepStrictEqual(result, { name: 'xyz', start: 3, end: 19 });
      });
    });

    describe('Escape characters', function () {
      it("should match for 'dataNodes[\"xy'z\"]' despite quote", function () {
        const result = JSEditorCompletion._locateDataNodes('dataNodes["xy\'z"]', 0);
        assert.deepStrictEqual(result, { name: "xy'z", start: 0, end: 17 });
      });

      it('should match for \'dataNodes["xy\\"z"]\' despite escaped double quote', function () {
        const result = JSEditorCompletion._locateDataNodes('dataNodes["xy\\"z"]', 0);
        assert.deepStrictEqual(result, { name: 'xy"z', start: 0, end: 18 });
      });

      it('should not match \'dataNodes["xyz\\"]\' because of escaped quote', function () {
        const result = JSEditorCompletion._locateDataNodes('dataNodes["xyz\\"]', 0);
        assert.deepStrictEqual(result, undefined);
      });

      it("should not match 'dataNodes[\"xyz']' because of mismatched quote", function () {
        const result = JSEditorCompletion._locateDataNodes('dataNodes["xyz\']', 0);
        assert.deepStrictEqual(result, undefined);
      });

      it('should match \'dataNodes["xyz\\\\"]\' despite escaped backslash', function () {
        const result = JSEditorCompletion._locateDataNodes('dataNodes["xyz\\\\"]', 0);
        assert.deepStrictEqual(result, { name: 'xyz\\', start: 0, end: 18 });
      });
    });

    // Weird names and blanks
    describe('Blanks', function () {
      it('should match for \'dataNodes["7a#$@^_ \\\\/"]\'', function () {
        const result = JSEditorCompletion._locateDataNodes('dataNodes["7a#$@^_ \\\\/"]', 0);
        assert.deepStrictEqual(result, { name: '7a#$@^_ \\/', start: 0, end: 24 });
      });

      it('should match for \'dataNodes [ "xyz"   ]\'', function () {
        const result = JSEditorCompletion._locateDataNodes('dataNodes [ "xyz"   ]', 0);
        assert.deepStrictEqual(result, { name: 'xyz', start: 0, end: 21 });
      });

      it('should match for \'dataNodes\t[\t"xyz"\t \t]\'', function () {
        const result = JSEditorCompletion._locateDataNodes('dataNodes\t[\t"xyz"\t \t]', 0);
        assert.deepStrictEqual(result, { name: 'xyz', start: 0, end: 21 });
      });
    });

    // multiple ds
    describe('Discrimination on cursor position when multiple matches on the line', function () {
      const str = 'dataNodes["a"] dataNodes["b"]dataNodes["c"] plop';

      it(`should find "a" for \'${str}\'`, function () {
        const matchA = { name: 'a', start: 0, end: 14 };
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 0), matchA);
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 11), matchA);
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 14), matchA);
      });

      it(`should find "b" for \'${str}\'`, function () {
        const matchB = { name: 'b', start: 15, end: 29 };
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 15), matchB);
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 25), matchB);
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 29), matchB);
      });

      it(`should find "c" for \'${str}\'`, function () {
        const matchC = { name: 'c', start: 29, end: 43 };
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 30), matchC);
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 43), matchC);
      });

      it(`should find nothing for \'${str}\' when past last match`, function () {
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 44), undefined);
        assert.deepStrictEqual(JSEditorCompletion._locateDataNodes(str, 46), undefined);
      });
    });
  });

  describe('locateDataNodesPrefix', function () {
    const plopStr = 'plop + dataNodes["xyz';
    it(`should not match before quotes for '${plopStr}'`, function () {
      assert.deepStrictEqual(JSEditorCompletion._locateDataNodesPrefix(plopStr, 0), undefined);
      assert.deepStrictEqual(JSEditorCompletion._locateDataNodesPrefix(plopStr, 7), undefined);
      assert.deepStrictEqual(JSEditorCompletion._locateDataNodesPrefix(plopStr, 16), undefined);
      assert.deepStrictEqual(JSEditorCompletion._locateDataNodesPrefix(plopStr, 17), undefined);
    });

    it(`should match after quotes for '${plopStr}'`, function () {
      assert.deepStrictEqual(JSEditorCompletion._locateDataNodesPrefix(plopStr, 18), { prefix: '', start: 7, end: 18 });
      assert.deepStrictEqual(JSEditorCompletion._locateDataNodesPrefix(plopStr, 19), {
        prefix: 'x',
        start: 7,
        end: 19,
      });
      assert.deepStrictEqual(JSEditorCompletion._locateDataNodesPrefix(plopStr, 20), {
        prefix: 'xy',
        start: 7,
        end: 20,
      });
      assert.deepStrictEqual(JSEditorCompletion._locateDataNodesPrefix(plopStr, 21), {
        prefix: 'xyz',
        start: 7,
        end: 21,
      });
    });

    it(`should match prefix "aa" for 'dataNodes[\'nope\' ] dataNodes[ "nope"] dataNodes [\'aa dataNodes["nope"]'`, function () {
      assert.deepStrictEqual(
        JSEditorCompletion._locateDataNodesPrefix(
          'dataNodes[\'nope\' ] dataNodes[ "nope"] dataNodes [\'aa dataNodes["nope"]',
          52
        ),
        { prefix: 'aa', start: 38, end: 52 }
      );
    });
  });

  describe('decodePath', function () {
    describe('Basics', function () {
      it(`should decode empty string as empty path`, function () {
        const result = JSEditorCompletion._decodePath('');
        assert.deepStrictEqual(result, { path: [], length: 0 });
      });

      it(`should parse array number in "[42]"`, function () {
        const result = JSEditorCompletion._decodePath('[42]');
        assert.deepStrictEqual(result, { path: [42], length: 4 });
      });

      it(`should parse key in "['xyz']"`, function () {
        const result = JSEditorCompletion._decodePath("['xyz']");
        assert.deepStrictEqual(result, { path: ['xyz'], length: 7 });
      });

      it(`should parse key in '["xyz"]'`, function () {
        const result = JSEditorCompletion._decodePath('["xyz"]');
        assert.deepStrictEqual(result, { path: ['xyz'], length: 7 });
      });

      it(`should parse complete path in "['x'][8]["z"]"`, function () {
        const result = JSEditorCompletion._decodePath(`['x'][8]["z"]`);
        assert.deepStrictEqual(result, { path: ['x', 8, 'z'], length: 13 });
      });

      it(`should ignore remaining characters in "[1]['z']bbbb"`, function () {
        const result = JSEditorCompletion._decodePath("[1]['z']bbbb");
        assert.deepStrictEqual(result, { path: [1, 'z'], length: 8 });
      });

      it(`should ignore remaining characters in "[1]['z']["`, function () {
        const result = JSEditorCompletion._decodePath("[1]['z'][");
        assert.deepStrictEqual(result, { path: [1, 'z'], length: 8 });
      });

      it(`should ignore remaining characters in "[1]['z']      a"`, function () {
        const result = JSEditorCompletion._decodePath("[1]['z']      a");
        assert.deepStrictEqual(result, { path: [1, 'z'], length: 8 });
      });
    });

    describe('Escape characters', function () {
      it(`should accept alternating quotes in \`["x'yz"]['x"yz']\``, function () {
        const result = JSEditorCompletion._decodePath(`["x'yz"]['x"yz']`);
        assert.deepStrictEqual(result, { path: ["x'yz", 'x"yz'], length: 16 });
      });

      it(`should accept escaped quotes in \`["x\\"y"]['x\\'y']\``, function () {
        const result = JSEditorCompletion._decodePath(`["x\\"y"]['x\\'y']`);
        assert.deepStrictEqual(result, { path: ['x"y', "x'y"], length: 16 });
      });

      it(`should ignore escaped backslashes in \`["x\\\\"]['y\\\\']\``, function () {
        const result = JSEditorCompletion._decodePath(`["x\\\\"]['y\\\\']`);
        assert.deepStrictEqual(result, { path: ['x\\', 'y\\'], length: 14 });
      });

      it(`should accept tabs and line returns in \`["\\n"]['\\t']\``, function () {
        const result = JSEditorCompletion._decodePath(`["\\n"]['\\t']`);
        assert.deepStrictEqual(result, { path: ['\n', '\t'], length: 12 });
      });
    });

    describe('White spaces', function () {
      it(`should not be bothered by spaces in "[  'x'] [8 ]\t[\t"z"]"`, function () {
        const result = JSEditorCompletion._decodePath(`[  'x'] [8 ]\t[\t"z"]`);
        assert.deepStrictEqual(result, { path: ['x', 8, 'z'], length: 19 });
      });
    });
  });

  describe('locatePath', function () {
    it(`should recognize empty path 'dataNodes["a"]'`, function () {
      const result = JSEditorCompletion._locatePath('dataNodes["a"]', 16, 16);
      assert.deepStrictEqual(result, { path: [], completionStart: 16, completionEnd: 16 });
    });

    it(`should ignore path after cursor in 'dataNodes["a"][0]'`, function () {
      const result = JSEditorCompletion._locatePath('dataNodes["a"][0]', 16, 16);
      assert.deepStrictEqual(result, { path: [], completionStart: 16, completionEnd: 16 });
    });

    it(`should ignore path when cursor in next expression in 'dataNodes["a"][0]+'`, function () {
      const result = JSEditorCompletion._locatePath('dataNodes["a"][0]+', 14, 18);
      assert.deepStrictEqual(result, undefined);
    });

    it(`should recognize path in 'dataNodes["a"][0]'`, function () {
      const result = JSEditorCompletion._locatePath('dataNodes["a"][0]', 14, 17);
      assert.deepStrictEqual(result, { path: [0], completionStart: 17, completionEnd: 17 });
    });

    it(`should recognize path in 'dataNodes["a"][0]["x"][1]  +'`, function () {
      const result = JSEditorCompletion._locatePath('dataNodes["a"][0]["x"][1]  +', 14, 25);
      assert.deepStrictEqual(result, { path: [0, 'x', 1], completionStart: 25, completionEnd: 25 });
    });

    it(`should swallow spaces in 'dataNodes["a"][0]   +'`, function () {
      const result = JSEditorCompletion._locatePath('dataNodes["a"][0]   +', 14, 19);
      assert.deepStrictEqual(result, { path: [0], completionStart: 17, completionEnd: 19 });
    });

    it(`should swallow bracket 'dataNodes["a"][0] [  +'`, function () {
      const result = JSEditorCompletion._locatePath('dataNodes["a"][0] [  +', 14, 19);
      assert.deepStrictEqual(result, { path: [0], completionStart: 17, completionEnd: 19 });
    });

    it(`should swallow quote in 'dataNodes["a"][0]["  +'`, function () {
      const result = JSEditorCompletion._locatePath('dataNodes["a"][0]["  +', 14, 19);
      assert.deepStrictEqual(result, { path: [0], completionStart: 17, completionEnd: 19 });
    });
  });

  describe('getDsData', function () {
    const ds = [_pseudoDs('a', 'b'), _pseudoDs('obj', { x: 'y' }), _pseudoDs('void', undefined)];

    it(`should return the datanode's data when found`, function () {
      assert.deepStrictEqual(JSEditorCompletion._getDsData(ds, 'a'), 'b');
      assert.deepStrictEqual(JSEditorCompletion._getDsData(ds, 'obj'), { x: 'y' });
    });

    it(`should return undefined when datanode does not exists`, function () {
      assert.deepStrictEqual(JSEditorCompletion._getDsData(ds, 'plop'), undefined);
    });

    it(`should return undefined when datanode has no data`, function () {
      assert.deepStrictEqual(JSEditorCompletion._getDsData(ds, 'void'), undefined);
    });
  });

  describe('resolvePath', function () {
    const data = {
      n: 0,
      s: 'str',
      arr: [1, 2, 3, null],
      arr2: [{ a: 'a' }],
      obj: {
        x: 'y',
      },
      b: false,
      's p a c e': '!',
    };

    it(`should access []`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, []), data);
    });

    it(`should access object fields`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['n']), 0);
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['s']), 'str');
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['b']), false);
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['arr']), [1, 2, 3, null]);
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['obj']), { x: 'y' });
    });

    it(`should access keys that are not identifiers fields`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['s p a c e']), '!');
    });

    it(`should access arrays`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['arr', 1]), 2);
      assert.strictEqual(JSEditorCompletion._resolvePath(data, ['arr', 3]), null);
    });

    it(`should chain path steps`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['arr2', 0, 'a']), 'a');
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['obj', 'x']), 'y');
    });

    it(`should return undefined for missing array index`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['arr', 42]), undefined);
    });

    it(`should return undefined for missing object key`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['plop']), undefined);
    });

    it(`should return undefined for using string on array`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['arr', 'str']), undefined);
      assert.deepStrictEqual(JSEditorCompletion._resolvePath([1, 2], ['arr']), undefined);
    });

    it(`should return undefined for indices on objects`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, [0]), undefined);
    });

    it(`should return undefined accessing undefined`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(undefined, ['a']), undefined);
    });

    it(`should return undefined accessing null`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(null, ['a']), undefined);
    });

    it(`should return undefined when chaining after null`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['arr', 3, 0]), undefined);
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['arr', 3, 'plop']), undefined);
    });

    it(`should return undefined when chaining after undefined`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(data, ['x', 'x']), undefined);
    });

    it(`should return undefined when chaining after string`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath('str', ['x']), undefined);
      assert.deepStrictEqual(JSEditorCompletion._resolvePath('str', [0]), undefined);
    });

    it(`should return undefined when chaining after number`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(10, ['x']), undefined);
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(10, [0]), undefined);
    });

    it(`should return undefined when chaining after boolean`, function () {
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(true, ['x']), undefined);
      assert.deepStrictEqual(JSEditorCompletion._resolvePath(true, [0]), undefined);
    });
  });

  describe('quoteString', function () {
    it(`should add double quotes to \`x'y\``, function () {
      assert.deepStrictEqual(JSEditorCompletion._quoteString(`x'y`), `"x'y"`);
    });

    it(`should add double quotes and escape double quotes in \`x"y\``, function () {
      assert.deepStrictEqual(JSEditorCompletion._quoteString(`x"y`), `"x\\"y"`);
    });

    it(`should add double quotes and escape backslash in \`x\\y\``, function () {
      assert.deepStrictEqual(JSEditorCompletion._quoteString(`x\\y`), `"x\\\\y"`);
    });

    it(`should add double quotes and escape tab in \`x\ty\``, function () {
      assert.deepStrictEqual(JSEditorCompletion._quoteString(`x\ty`), `"x\\ty"`);
    });
  });

  describe('valueToText', function () {
    it(`should represent null correctly`, function () {
      assert.deepStrictEqual(JSEditorCompletion._valueToText(null), `null`);
    });

    it(`should represent numbers correctly`, function () {
      assert.deepStrictEqual(JSEditorCompletion._valueToText(0), `0`);
      assert.deepStrictEqual(JSEditorCompletion._valueToText(42), `42`);
      assert.deepStrictEqual(JSEditorCompletion._valueToText(3.14), `3.14`);
    });

    it(`should represent booleans correctly`, function () {
      assert.deepStrictEqual(JSEditorCompletion._valueToText(true), `true`);
      assert.deepStrictEqual(JSEditorCompletion._valueToText(false), `false`);
    });

    it(`should represent strings correctly`, function () {
      assert.deepStrictEqual(JSEditorCompletion._valueToText('xxx'), `"xxx"`);
      assert.deepStrictEqual(JSEditorCompletion._valueToText('x"x'), `"x\\"x"`);
    });

    it(`should represent arrays correctly`, function () {
      assert.deepStrictEqual(JSEditorCompletion._valueToText([]), `[]`);
      assert.deepStrictEqual(JSEditorCompletion._valueToText([1, 'a']), `[1,"a"]`);
    });

    it(`should represent objects correctly`, function () {
      assert.deepStrictEqual(JSEditorCompletion._valueToText({}), `{}`);
      assert.deepStrictEqual(JSEditorCompletion._valueToText({ a: 1, b: 'c' }), `{"a":1,"b":"c"}`);
    });

    it(`should shorten strings correctly`, function () {
      assert.deepStrictEqual(JSEditorCompletion._valueToText('0123456789', 10), `"01234..."`);
    });

    it(`should shorten arrays correctly`, function () {
      assert.deepStrictEqual(JSEditorCompletion._valueToText([1, 2, 3, 4, 5, 6, 7, 8, 9], 10), `[1,2,3...]`);
    });

    it(`should shorten objects correctly`, function () {
      assert.deepStrictEqual(JSEditorCompletion._valueToText({ a: 1, b: '________' }, 10), `{"a":1...}`);
    });
  });

  describe('complete', function () {
    const ds = [
      _pseudoDs('data1', undefined),
      _pseudoDs('data2', { x: 'y', arr: [1, 2, 3] }),
      _pseudoDs('other', 'v2'),
    ];

    const allDs = ['dataNodes["data1"]', 'dataNodes["data2"]', 'dataNodes["other"]'];

    function _texts(result) {
      return result.list.map((r) => r.text);
    }

    it(`should suggest all dataNodes at start of line`, function () {
      const result = JSEditorCompletion._complete(ds, '', 0);
      assert.deepStrictEqual(_texts(result), allDs);
      assert.strictEqual(result.from, 0);
      assert.strictEqual(result.to, 0);
    });

    it(`should complete dataNodes`, function () {
      const result = JSEditorCompletion._complete(ds, 'dataNodes', 9);
      assert.deepStrictEqual(_texts(result), allDs);
      assert.strictEqual(result.from, 0);
      assert.strictEqual(result.to, 9);
    });

    it(`should complete dataNodes prefix 'd'`, function () {
      const result = JSEditorCompletion._complete(ds, 'd', 1);
      assert.deepStrictEqual(_texts(result), allDs);
      assert.strictEqual(result.from, 0);
      assert.strictEqual(result.to, 1);
    });

    it(`should complete dataNodes prefix 'dataN'`, function () {
      const result = JSEditorCompletion._complete(ds, 'dataN', 5);
      assert.deepStrictEqual(_texts(result), allDs);
      assert.strictEqual(result.from, 0);
      assert.strictEqual(result.to, 5);
    });

    it(`should default to all dataNodes `, function () {
      let result = JSEditorCompletion._complete(ds, 'dataNodes["data1"] //   ', 23);
      assert.deepStrictEqual(_texts(result), allDs);
      assert.strictEqual(result.from, 23);
      assert.strictEqual(result.to, 23);

      result = JSEditorCompletion._complete(ds, 'fdjkgvnjkdflnb', 2);
      assert.deepStrictEqual(_texts(result), allDs);
      assert.strictEqual(result.from, 2);
      assert.strictEqual(result.to, 2);
    });

    it(`should replace dataNodes when inside it`, function () {
      const result = JSEditorCompletion._complete(ds, 'dataNodes["data1"][42] lalala', 5);
      assert.deepStrictEqual(_texts(result), allDs);
      assert.strictEqual(result.from, 0);
      assert.strictEqual(result.to, 18);
    });

    it(`should filter when dataNodes start available`, function () {
      const result = JSEditorCompletion._complete(ds, 'dataNodes["da +', 12);
      assert.deepStrictEqual(_texts(result), ['dataNodes["data1"]', 'dataNodes["data2"]']);
      assert.strictEqual(result.from, 0);
      assert.strictEqual(result.to, 12);
    });

    it(`should suggest object fields`, function () {
      const result = JSEditorCompletion._complete(ds, 'dataNodes["data2"] +', 18);
      assert.deepStrictEqual(_texts(result), ['["x"]', '["arr"]']);
      assert.strictEqual(result.from, 18);
      assert.strictEqual(result.to, 18);
    });

    it(`should suggest nested array indices`, function () {
      const result = JSEditorCompletion._complete(ds, 'dataNodes["data1"]+dataNodes["data2"] ["arr"][ "  +', 49);
      assert.deepStrictEqual(_texts(result), ['[0]', '[1]', '[2]']);
      assert.strictEqual(result.from, 45);
      assert.strictEqual(result.to, 49);
    });

    it(`should stop at cursor`, function () {
      const result = JSEditorCompletion._complete(ds, 'dataNodes["data1"]+dataNodes["data2"]["arr"][ "  +', 37);
      assert.deepStrictEqual(_texts(result), ['["x"]', '["arr"]']);
      assert.strictEqual(result.from, 37);
      assert.strictEqual(result.to, 37);
    });

    it(`should prioritize completing the previous dataNodes`, function () {
      const result = JSEditorCompletion._complete(ds, 'dataNodes["data2"]dataNodes["data1"]', 18);
      assert.deepStrictEqual(_texts(result), ['["x"]', '["arr"]']);
      assert.strictEqual(result.from, 18);
      assert.strictEqual(result.to, 18);
    });
  });

  describe('getPrecedingPathLength', function () {
    it(`should return undefined for "" at 0`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('', 0), undefined);
    });

    it(`should return undefined for 'dataNodes["data2"][0] + ' at 25`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('dataNodes["data2"][0] + ', 25), undefined);
    });

    it(`should return 3 for 'dataNodes["data2"][0] ' at 21`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('dataNodes["data2"][0] ', 21), 3);
    });

    it(`should return 4 for 'dataNodes["data2"][0] ' at 24`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('dataNodes["data2"][0] ', 24), 4);
    });

    it(`should return 5 for 'dataNodes["data2"][ 0 ] ' at 23`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('dataNodes["data2"][ 0 ] ', 23), 5);
    });

    it(`should return 5 for 'dataNodes["data2"][0 ]["x"]' at 29`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('dataNodes["data2"][0 ]["x"]', 29), 5);
    });

    it(`should return 7 for 'dataNodes["data2"][0]["x\\\\"]' at 30`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('dataNodes["data2"][0]["x\\\\"]', 30), 7);
    });

    it(`should return 6 for 'dataNodes["data2"][0]["\\""]' at 29`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('dataNodes["data2"][0]["\\""]', 29), 6);
    });

    it(`should return 5 for 'dataNodes["data2"]['"']' at 26`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('dataNodes["data2"][\'"\']', 26), 5);
    });

    it(`should return 18 for 'dataNodes["data2"] ' at 18`, function () {
      assert.strictEqual(JSEditorCompletion.getPrecedingPathLength('dataNodes["data2"] ', 18), 18);
    });
  });
});

// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ widget-prototypes-manager                                             │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\

import _ from 'underscore';
import Ajv from 'ajv';
import { WidgetActuatorValidationError } from 'kernel/dashboard/plugins/widget-base';

export class WidgetPrototypesManager {
  static SCHEMA_VERSION = 'http://json-schema.org/draft-07/schema#';
  static ID_URI_SCHEME = 'json-schema:';

  static SCHEMA_ANYTHING = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:anything',
  };

  static SCHEMA_STRING = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:string',
    type: 'string',
  };

  static SCHEMA_NUMBER = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:number',
    type: 'number',
  };

  static SCHEMA_STRING_ARRAY = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:string_array',
    type: 'array',
    items: { type: 'string' },
  };

  static SCHEMA_NUMBER_ARRAY = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:number_array',
    type: 'array',
    items: { type: 'number' },
  };

  static SCHEMA_NUMBER_ARRAY_2D = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:number_array_2d',
    type: 'array',
    items: {
      type: 'array',
      items: { type: 'number' },
    },
  };

  static SCHEMA_PRIMITIVE_ARRAY = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:primitives_array',
    type: 'array',
    items: {
      anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    },
  };

  static SCHEMA_INTEGER = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:integer',
    type: 'integer',
  };

  static SCHEMA_BOOLEAN = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:boolean',
    type: 'boolean',
  };

  static SCHEMA_ANY_PRIMITIVE = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:primitives',
    anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
  };

  static SCHEMA_ANY_OBJECT = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:object',
    type: 'object',
  };

  static SCHEMA_FILE_LIKE = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:file',
    type: 'object',
    properties: {
      content: { type: 'string' },
      name: { type: 'string' },
      type: { type: 'string' },
      charset: { type: 'string' },
      isBinary: { type: 'boolean' },
    },
    required: ['content'],
  };

  static SCHEMA_NUMBER_OR_STRING = {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:number_or_string',
    anyOf: [{ type: 'string' }, { type: 'number' }],
  };

  constructor() {
    this.ajv = new Ajv();
  }

  /**
   * Compile (or recover from cache) the validator for a schema
   * @param {(Object|Object[])} schema json schema as an object. Must have a globaly unique `$id`. May be an array of schemas, in which case all schemas are added and the first one is compiled and returned (this is used for schemas built from others, to ensure all dependencies are referenced independently of reference order).
   * @returns the compiled validator
   */
  getOrCompile(schema) {
    if (Array.isArray(schema)) {
      for (const def of schema) {
        const key = def.$id;
        if (!this.ajv.getSchema(key)) {
          this.ajv.addSchema(def);
        }
      }
      return this.ajv.getSchema(schema[0].$id);
    }

    const key = schema.$id;
    const validator = this.ajv.getSchema(key);
    if (validator) {
      return validator;
    } else {
      return this.ajv.compile(schema);
    }
  }

  /**
   * Translates ajv errors into something a widget's actuator's validator can return.
   * Also tries to make messages more helpful and group errors (ex: nest the failures of each branch of an "anyOf" under it error).
   * @param {Array<Object>} errors array of errors returned by ajv
   * @returns {Array<WidgetActuatorValidationError>}
   */
  formatErrors(errors) {
    const self = this;

    function canGroup(e) {
      return ['anyOf', 'oneOf', 'allOf'].includes(e.keyword);
    }

    function convert(e, nested) {
      let msg = e.message;
      if (e.keyword === 'anyOf') {
        msg = 'One the the following must be true';
      } else if (e.keyword === 'const' && e.params.allowedValue !== undefined) {
        msg = `${msg} "${e.params.allowedValue}"`;
      }
      return new WidgetActuatorValidationError(e.instancePath ? `"${e.instancePath}": ${msg}` : msg, nested);
    }

    function createComposite(composite, nested) {
      nested = self.formatErrors(nested);
      return convert(composite, nested);
    }

    let result = [];

    errors = _.sortBy(errors, (e) => e.schemaPath.length);
    let composite;
    while ((composite = errors.find(canGroup))) {
      const prefix = composite.schemaPath;
      const nested = [];
      const rest = [];
      for (const e of errors) {
        if (e !== composite) {
          if (e.schemaPath.startsWith(prefix)) {
            nested.push(e);
          } else {
            rest.push(e);
          }
        }
      }

      result.push(createComposite(composite, nested));
      errors = rest;
    }

    result = [...result, ...errors.map((_) => convert(_, []))];
    result = result.sort((a, b) => a.compareTo(b));
    return result.filter((e, i, arr) => i === 0 || e.compareTo(arr[i - 1]) !== 0);
  }
}

export const widgetPrototypesManager = new WidgetPrototypesManager();

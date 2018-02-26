
// JS-YAML's default schema for `load` function.
// It is not described in the YAML specification.
//
// This schema is based on JS-YAML's default safe schema and includes
// JavaScript-specific types: !!js/undefined, !!js/regexp and !!js/function.
//
// Also this schema is used as default base schema at `Schema.create` function.

import { Schema } from '../schema';

import DefaultSafe from './default_safe';

import UndefinedType from '../type/js/undefined';
import RegexpType from '../type/js/regexp';

var schema = new Schema({
  include: [
    DefaultSafe
  ],
  explicit: [
    UndefinedType,
    RegexpType

  ]
})
Schema.DEFAULT = schema;
export default schema;

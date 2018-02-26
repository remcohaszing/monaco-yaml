
// Standard YAML's JSON schema.
// http://www.yaml.org/spec/1.2/spec.html#id2803231
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, this schema is not such strict as defined in the YAML specification.
// It allows numbers in binary notaion, use `Null` and `NULL` as `null`, etc.

import { Schema } from '../schema';

import failsafe from './failsafe';

import NullType from '../type/null';
import BoolType from '../type/bool';
import IntType from '../type/int';
import FloatType from '../type/float';

export default new Schema({
  include: [
    failsafe
  ],
  implicit: [
    NullType,
    BoolType,
    IntType,
    FloatType
  ]
});

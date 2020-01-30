// Standard YAML's JSON schema.
// http://www.yaml.org/spec/1.2/spec.html#id2803231
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, this schema is not such strict as defined in the YAML specification.
// It allows numbers in binary notaion, use `Null` and `NULL` as `null`, etc.

'use strict';
import { Schema } from '../schema';
import failsafe from './failsafe';
import typeNull from '../type/null';
import typeBool from '../type/bool';
import typeInt from '../type/int';
import typeFloat from '../type/float';

export default new Schema({
  include: [failsafe],
  implicit: [typeNull, typeBool, typeInt, typeFloat],
});

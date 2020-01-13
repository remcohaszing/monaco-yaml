// JS-YAML's default schema for `safeLoad` function.
// It is not described in the YAML specification.
//
// This schema is based on standard YAML's Core schema and includes most of
// extra types described at YAML tag repository. (http://yaml.org/type/)

'use strict';

import { Schema } from '../schema';
import core from './core';
import typeTimestamp from '../type/timestamp';
import typeMerge from '../type/merge';
import typeBinary from '../type/binary';
import typeOmap from '../type/omap';
import typePairs from '../type/pairs';
import typeSet from '../type/set';
var schema = new Schema({
  include: [core],
  implicit: [typeTimestamp, typeMerge],
  explicit: [typeBinary, typeOmap, typePairs, typeSet],
});
export default schema;

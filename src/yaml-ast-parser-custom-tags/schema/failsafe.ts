// Standard YAML's Failsafe schema.
// http://www.yaml.org/spec/1.2/spec.html#id2802346

'use strict';

import { Schema } from '../schema';
import typeStr from '../type/str';
import typeSeq from '../type/seq';
import typeMap from '../type/map';

export default new Schema({
  explicit: [typeStr, typeSeq, typeMap],
});

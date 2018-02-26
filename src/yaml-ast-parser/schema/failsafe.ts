

// Standard YAML's Failsafe schema.
// http://www.yaml.org/spec/1.2/spec.html#id2802346

import { Schema } from '../schema';

import StrType from '../type/str';
import SeqType from '../type/seq';
import MapType from '../type/map';

export default new Schema({
  explicit: [
    StrType,
    SeqType,
    MapType
  ]
});

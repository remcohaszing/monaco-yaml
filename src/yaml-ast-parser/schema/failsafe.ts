// Standard YAML's Failsafe schema.
// http://www.yaml.org/spec/1.2/spec.html#id2802346

import { Schema } from '../schema';

import MapType from '../type/map';
import SeqType from '../type/seq';
import StrType from '../type/str';

export default new Schema({
  explicit: [StrType, SeqType, MapType],
});

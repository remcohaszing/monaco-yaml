// Standard YAML's Core schema.
// http://www.yaml.org/spec/1.2/spec.html#id2804923
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, Core schema has no distinctions from JSON schema is JS-YAML.

'use strict';

import { Schema } from '../schema';
import json from './json';

export default new Schema({
  include: [json],
});

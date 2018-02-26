

// JS-YAML's default schema for `safeLoad` function.
// It is not described in the YAML specification.
//
// This schema is based on standard YAML's Core schema and includes most of
// extra types described at YAML tag repository. (http://yaml.org/type/)


import { Schema } from '../schema';

import Core from './core';
import TimestampType from '../type/timestamp';
import MergeType from '../type/merge';
import BinaryType from '../type/binary';
import OmapType from '../type/omap';
import PairsType from '../type/pairs';
import SetType from '../type/set';

export default new Schema({
  include: [
    Core
  ],
  implicit: [
    TimestampType,
    MergeType
  ],
  explicit: [
    BinaryType,
    OmapType,
    PairsType,
    SetType
  ]
})

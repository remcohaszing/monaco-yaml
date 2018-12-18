/**
 * Created by kor on 06/05/15.
 */
import YAMLException from './exception';
export enum Kind {
  SCALAR,
  MAPPING,
  MAP,
  SEQ,
  ANCHOR_REF,
  INCLUDE_REF,
}

export interface YAMLDocument {
  startPosition: number;
  endPosition: number;
  errors: YAMLException[];
}
export interface YAMLNode extends YAMLDocument {
  startPosition: number;
  endPosition: number;
  kind: Kind;
  colonPosition?: number; // Nearest colon position.
  anchorId?: string;
  valueObject?: any;
  parent: YAMLNode;
  errors: YAMLException[];
  /**
   * @deprecated Inspect kind and cast to the appropriate subtype instead.
   */
  value?: any;

  /**
   * @deprecated Inspect kind and cast to the appropriate subtype instead.
   */
  key?: any;

  /**
   * @deprecated Inspect kind and cast to the appropriate subtype instead.
   */
  mappings?: any;
}

export interface YAMLAnchorReference extends YAMLNode {
  referencesAnchor: string;
  value: YAMLNode;
}
export interface YAMLScalar extends YAMLNode {
  value: string;
  doubleQuoted?: boolean;
  singleQuoted?: boolean;
  plainScalar?: boolean;
  rawValue: string;
}

export interface YAMLMapping extends YAMLNode {
  key: YAMLScalar;
  value: YAMLNode;
}
export interface YAMLSequence extends YAMLNode {
  items: YAMLNode[];
}
export interface YamlMap extends YAMLNode {
  mappings: YAMLMapping[];
}
export function newMapping(key: YAMLScalar, value: YAMLNode): YAMLMapping {
  const end = value ? value.endPosition : key.colonPosition + 1;
  const node = {
    key,
    value,
    startPosition: key.startPosition,
    endPosition: end,
    kind: Kind.MAPPING,
    parent: null,
    errors: [],
  };
  return node;
}
export function newAnchorRef(
  key: string,
  start: number,
  end: number,
  value: YAMLNode
): YAMLAnchorReference {
  return {
    errors: [],
    referencesAnchor: key,
    value,
    startPosition: start,
    endPosition: end,
    kind: Kind.ANCHOR_REF,
    parent: null,
  };
}
export function newScalar(v: string = ''): YAMLScalar {
  return {
    errors: [],
    startPosition: -1,
    endPosition: -1,
    value: v,
    kind: Kind.SCALAR,
    parent: null,
    doubleQuoted: false,
    rawValue: v,
  };
}
export function newItems(): YAMLSequence {
  return {
    errors: [],
    startPosition: -1,
    endPosition: -1,
    items: [],
    kind: Kind.SEQ,
    parent: null,
  };
}
export function newSeq(): YAMLSequence {
  return newItems();
}
export function newMap(mappings?: YAMLMapping[]): YamlMap {
  return {
    errors: [],
    startPosition: -1,
    endPosition: -1,
    mappings: mappings ? mappings : [],
    kind: Kind.MAP,
    parent: null,
  };
}

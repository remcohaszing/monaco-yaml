import { Type } from '../type';

function resolveYamlNull(data) {
  if (null === data) {
    return true;
  }

  const max = data.length;

  return (
    (max === 1 && data === '~') ||
    (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'))
  );
}

function constructYamlNull() {
  return null;
}

function isNull(object) {
  return null === object;
}

export default new Type('tag:yaml.org,2002:null', {
  kind: 'scalar',
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical() {
      return '~';
    },
    lowercase() {
      return 'null';
    },
    uppercase() {
      return 'NULL';
    },
    camelcase() {
      return 'Null';
    },
  },
  defaultStyle: 'lowercase',
});

import { Type } from '../type';

function resolveYamlBoolean(data) {
  if (null === data) {
    return false;
  }

  const max = data.length;

  return (
    (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
    (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'))
  );
}

function constructYamlBoolean(data) {
  return data === 'true' || data === 'True' || data === 'TRUE';
}

function isBoolean(object) {
  return '[object Boolean]' === Object.prototype.toString.call(object);
}

export default new Type('tag:yaml.org,2002:bool', {
  kind: 'scalar',
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase(object) {
      return object ? 'true' : 'false';
    },
    uppercase(object) {
      return object ? 'TRUE' : 'FALSE';
    },
    camelcase(object) {
      return object ? 'True' : 'False';
    },
  },
  defaultStyle: 'lowercase',
});

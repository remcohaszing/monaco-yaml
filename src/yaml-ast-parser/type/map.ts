import { Type } from '../type';

export default new Type('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct(data) {
    return null !== data ? data : {};
  },
});

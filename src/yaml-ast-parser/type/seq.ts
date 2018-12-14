import { Type } from '../type';

export default new Type('tag:yaml.org,2002:seq', {
  kind: 'sequence',
  construct(data) {
    return null !== data ? data : [];
  },
});

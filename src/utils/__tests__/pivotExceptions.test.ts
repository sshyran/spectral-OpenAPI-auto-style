import { RulesetExceptionCollection } from '../../types/ruleset';
import { pivotExceptions } from '../pivotExceptions';

describe('pivotExceptions', () => {
  it('should pivot exceptions', () => {
    const exceptions: RulesetExceptionCollection = {
      a: [],
      b: ['1', '2'],
      c: ['2', '3'],
    };

    expect(pivotExceptions(exceptions)).toEqual({ '1': ['b'], '2': ['b', 'c'], '3': ['c'] });
  });
});

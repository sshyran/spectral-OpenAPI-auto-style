import { Dictionary } from '@stoplight/types';
import { RulesetExceptionCollection } from '../types/ruleset';

export const pivotExceptions = (exceptions: RulesetExceptionCollection): Dictionary<string[], string> => {
  const dic: Dictionary<string[], string> = {};

  Object.entries(exceptions).forEach(([location, rules]) => {
    rules.forEach(rule => {
      if (!(rule in dic)) {
        dic[rule] = [];
      }

      dic[rule].push(location);
    });
  });

  return dic;
};

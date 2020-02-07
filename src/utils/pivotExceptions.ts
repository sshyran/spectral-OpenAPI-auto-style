import { extractPointerFromRef, pointerToPath } from '@stoplight/json';
import { Dictionary, IRange } from '@stoplight/types';
import { DocumentInventory } from '../documentInventory';
import { IRunRule } from '../types';
import { RulesetExceptionCollection } from '../types/ruleset';
import { extractThings } from './extractThings';

export const pivotExceptions = (
  exceptions: RulesetExceptionCollection,
  inventory: DocumentInventory,
  runRules: Dictionary<IRunRule, string>,
): Dictionary<IRange[], string> => {
  const dic: Dictionary<IRange[], string> = {};

  Object.entries(exceptions).forEach(([location, rules]) => {
    const pointer = extractPointerFromRef(location);

    const exceptionPath = pointerToPath(pointer!);

    rules.forEach(rulename => {
      const rule = runRules[rulename];

      if (rule !== undefined) {
        if (!(rulename in dic)) {
          dic[rulename] = [];
        }

        const { range } = extractThings(inventory, exceptionPath, rule.resolved !== false);

        dic[rulename].push(range);
      }
    });
  });

  return dic;
};

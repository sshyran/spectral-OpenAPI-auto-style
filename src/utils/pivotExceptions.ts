import { extractPointerFromRef, pointerToPath } from '@stoplight/json';
import { Dictionary } from '@stoplight/types';
import { DocumentInventory } from '../documentInventory';
import { RulesetExceptionCollection } from '../types/ruleset';
import { getClosestJsonPath } from './refs';

export const pivotExceptions = (
  exceptions: RulesetExceptionCollection,
  inventory: DocumentInventory,
): Dictionary<string[], string> => {
  const dic: Dictionary<string[], string> = {};

  Object.entries(exceptions).forEach(([location, rules]) => {
    rules.forEach(rule => {
      if (!(rule in dic)) {
        dic[rule] = [];
      }

      const pointer = extractPointerFromRef(location);

      const path = pointerToPath(pointer!);
      const associatedItem = inventory.findAssociatedItemForPath(path, true);
      const path2 = associatedItem?.path || getClosestJsonPath(inventory.resolved, path);
      console.log(path);
      console.log(associatedItem);
      console.log(path2);
      dic[rule].push(location);
    });
  });

  return dic;
};

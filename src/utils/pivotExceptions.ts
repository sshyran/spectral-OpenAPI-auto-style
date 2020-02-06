import { extractPointerFromRef, pointerToPath } from '@stoplight/json';
import { Dictionary } from '@stoplight/types';
import { Document } from '../document';
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

      const exceptionPath = pointerToPath(pointer!);
      const associatedItem = inventory.findAssociatedItemForPath(exceptionPath, true);
      const path = associatedItem?.path || getClosestJsonPath(inventory.resolved, exceptionPath);
      const document = associatedItem?.document || inventory.document;
      const range = document.getRangeForJsonPath(path, true) || Document.DEFAULT_RANGE;

      console.log(path);
      console.log(associatedItem);
      console.log(range);
      dic[rule].push(location);
    });
  });

  return dic;
};

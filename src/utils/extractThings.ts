import { IRange, JsonPath } from '@stoplight/types';
import { Document } from '../document';
import { DocumentInventory, DocumentInventoryItem } from '../documentInventory';
import { getClosestJsonPath } from './refs';

export interface IThings {
  associatedItem: DocumentInventoryItem | null;
  path: JsonPath;
  range: IRange;
}

export const extractThings = (inventory: DocumentInventory, initialPath: JsonPath, resolved: boolean): IThings => {
  const associatedItem = inventory.findAssociatedItemForPath(initialPath, resolved);
  const path = associatedItem?.path || getClosestJsonPath(inventory.resolved, initialPath);
  const document = associatedItem?.document || inventory.document;
  const range = document.getRangeForJsonPath(path, true) || Document.DEFAULT_RANGE;

  return { associatedItem, path, range };
};

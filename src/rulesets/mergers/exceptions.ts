import { extractPointerFromRef, extractSourceFromRef, pointerToPath } from '@stoplight/json';
import { isAbsolute, join } from '@stoplight/path';
import { RulesetExceptionCollection } from '../../types/ruleset';

const normalize = (rulesetUri: string, $ref: string): string => {
  const source = extractSourceFromRef($ref);

  if (typeof source !== 'string') {
    throw new Error(buildErrorMessage(rulesetUri, $ref, 'Missing source'));
  }

  const pointer = extractPointerFromRef($ref);

  if (typeof pointer !== 'string') {
    throw new Error(buildErrorMessage(rulesetUri, $ref, 'Missing pointer fragment'));
  }

  try {
    pointerToPath(pointer);
  } catch {
    throw new Error(buildErrorMessage(rulesetUri, $ref));
  }

  const normalizedLocation = isAbsolute(source) ? $ref : join(rulesetUri, '..', source) + pointer;

  return normalizedLocation;
};

const buildErrorMessage = (rulesetUri: string, $ref: string, precision?: string): string => {
  return `Ruleset \`${rulesetUri}\` exposes an \`except\` key \`${$ref}\` which is not a valid uri${
    precision ? ` (${precision})` : ''
  }.`;
};

export function mergeExceptions(
  baseUri: string,
  target: RulesetExceptionCollection,
  source: RulesetExceptionCollection,
): void {
  for (const [location, sourceRules] of Object.entries(source)) {
    const normalizedLocation = normalize(baseUri, location);
    const targetRules = target[normalizedLocation] !== undefined ? target[normalizedLocation] : [];

    const set = new Set(targetRules);

    sourceRules.forEach(r => set.add(r));

    target[normalizedLocation] = [...set].sort();
  }
}

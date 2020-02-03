import { extractPointerFromRef, extractSourceFromRef, pointerToPath } from '@stoplight/json';
import { isAbsolute, join } from '@stoplight/path';
import { RulesetExceptionCollection } from '../../types/ruleset';

const normalize = ($ref: string, rulesetUri?: string): string => {
  const source = extractSourceFromRef($ref);

  if (typeof source !== 'string') {
    throw new Error(buildErrorMessage($ref, rulesetUri, 'Missing source'));
  }

  if (rulesetUri === undefined && !isAbsolute(source)) {
    throw new Error(
      buildErrorMessage($ref, rulesetUri, 'Only absolute Uris are allowed when no base ruleset uri has been provided'),
    );
  }

  const pointer = extractPointerFromRef($ref);

  if (typeof pointer !== 'string') {
    throw new Error(buildErrorMessage($ref, rulesetUri, 'Missing pointer fragment'));
  }

  try {
    pointerToPath(pointer);
  } catch {
    throw new Error(buildErrorMessage($ref, rulesetUri));
  }

  if (isAbsolute(source)) return $ref;

  if (rulesetUri === undefined) {
    return source + pointer;
  }

  return join(rulesetUri, '..', source) + pointer;
};

const buildErrorMessage = ($ref: string, rulesetUri?: string, precision?: string): string => {
  if (rulesetUri !== undefined)
    return `Ruleset \`${rulesetUri}\` exposes an \`except\` key \`${$ref}\` which is not a valid uri${
      precision ? ` (${precision})` : ''
    }.`;

  return `\`except\` key \`${$ref}\` is not a valid uri${precision ? ` (${precision})` : ''}.`;
};

export function mergeExceptions(
  target: RulesetExceptionCollection,
  source: RulesetExceptionCollection,
  baseUri?: string,
): void {
  for (const [location, sourceRules] of Object.entries(source)) {
    const normalizedLocation = normalize(location, baseUri);
    const targetRules = target[normalizedLocation] !== undefined ? target[normalizedLocation] : [];

    const set = new Set(targetRules);

    sourceRules.forEach(r => set.add(r));

    target[normalizedLocation] = [...set].sort();
  }
}

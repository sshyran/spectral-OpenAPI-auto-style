import { extractPointerFromRef, extractSourceFromRef, pointerToPath } from '@stoplight/json';
import { isAbsolute, join } from '@stoplight/path';
import { RulesetExceptionCollection } from '../../types/ruleset';

const normalize = ($ref: string, rulesetUri?: string): string => {
  const source = extractSourceFromRef($ref);

  if (typeof source !== 'string') {
    throw new Error(buildInvalidUriErrorMessage($ref, rulesetUri, 'Missing source'));
  }

  if (rulesetUri === undefined && !isAbsolute(source)) {
    throw new Error(
      buildInvalidUriErrorMessage(
        $ref,
        rulesetUri,
        'Only absolute Uris are allowed when no base ruleset uri has been provided',
      ),
    );
  }

  const pointer = extractPointerFromRef($ref);

  if (typeof pointer !== 'string') {
    throw new Error(buildInvalidUriErrorMessage($ref, rulesetUri, 'Missing pointer fragment'));
  }

  try {
    pointerToPath(pointer);
  } catch {
    throw new Error(buildInvalidUriErrorMessage($ref, rulesetUri));
  }

  if (isAbsolute(source)) return $ref;

  if (rulesetUri === undefined) {
    return source + pointer;
  }

  return join(rulesetUri, '..', source) + pointer;
};

const buildErrorMessagePrefix = ($ref: string, rulesetUri?: string): string => {
  let prefix = '';

  if (rulesetUri !== undefined) prefix += `in ruleset \`${rulesetUri}\`, `;

  return prefix + `\`except\` entry (key \`${$ref}\`) is malformed. `;
};

const buildInvalidUriErrorMessage = ($ref: string, rulesetUri?: string, precision?: string): string => {
  return (
    buildErrorMessagePrefix($ref, rulesetUri) +
    `Key \`${$ref}\` is not a valid uri${precision ? ` (${precision})` : ''}.`
  );
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

    if (sourceRules.length === 0) {
      throw new Error(buildErrorMessagePrefix(location, baseUri) + 'An empty array of rules has been provided.');
    }

    sourceRules.forEach(r => {
      if (r.length === 0) {
        throw new Error(buildErrorMessagePrefix(location, baseUri) + 'A rule with an empty name has been provided.');
      }
      set.add(r);
    });

    target[normalizedLocation] = [...set].sort();
  }
}

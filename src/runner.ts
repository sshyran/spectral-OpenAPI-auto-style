const { JSONPath } = require('jsonpath-plus');

import { IRange } from '@stoplight/types';
import { DocumentInventory } from './documentInventory';
import { lintNode } from './linter';
import { getDiagnosticSeverity } from './rulesets/severity';
import { FunctionCollection, IGivenNode, IRule, IRuleResult, IRunRule, RunRuleCollection } from './types';
import { RulesetExceptionCollection } from './types/ruleset';
import { hasIntersectingElement } from './utils/';
import { pivotExceptions } from './utils/pivotExceptions';

export const isRuleEnabled = (rule: IRule) => rule.severity !== void 0 && getDiagnosticSeverity(rule.severity) !== -1;

export const runRules = (
  documentInventory: DocumentInventory,
  rules: RunRuleCollection,
  functions: FunctionCollection,
  exceptions: RulesetExceptionCollection,
): IRuleResult[] => {
  const results: IRuleResult[] = [];

  // TODO:
  // Ruleset
  // - should not accept an empty array of rules, or rules with empty names (to enforce in merge vs schema validation?)
  // - To be investigated: How to cope with STDIN as a source?
  // LoadRuleSet
  // - TODO: Find out how paths that escape out of the root behave
  // Spectral
  // - idea: report exceptions hit through a new 'Silenced' Severy level (-2) -> This opens up a wide range of possible user friendly reporting
  // - (optional) report the exceptions that haven't been triggered (to potentially help the user find out wrong paths)
  // - (optional) report the exceptions that point at unknown (or silenced) rules (to potentially help the user find out wrong ruleset/excepts)
  // Cli
  // - (optional) before the start of analysis, should display something like "x loaded exceptions (spanning y files)"
  // - (optional) should diplay a warning related to orphaned exceptions (exceptions that haven't been been triggered by the last run) in order to clean up obsolete exceptions
  // - (optional) report issues that have been silenced
  // To be investigated
  // - impact of rule with resolved true vs false
  // - (optional) Allow accepting wide range and use rangeInclude() rather than rangeEqual() in isAKnownException()

  const exceptRuleByLocations = pivotExceptions(exceptions, documentInventory, rules);

  for (const name in rules) {
    if (!rules.hasOwnProperty(name)) continue;

    const rule = rules[name];
    if (!rule) continue;

    if (
      rule.formats !== void 0 &&
      (documentInventory.formats === null ||
        (documentInventory.formats !== void 0 && !hasIntersectingElement(rule.formats, documentInventory.formats)))
    ) {
      continue;
    }

    if (!isRuleEnabled(rule)) {
      continue;
    }

    let ruleResults: IRuleResult[] = [];

    try {
      ruleResults = runRule(documentInventory, rule, functions, exceptRuleByLocations[name]);
    } catch (e) {
      console.error(`Unable to run rule '${name}':\n${e}`);
    }

    results.push(...ruleResults);
  }

  return results;
};

const runRule = (
  resolved: DocumentInventory,
  rule: IRunRule,
  functions: FunctionCollection,
  exceptionLocations: IRange[] | undefined,
): IRuleResult[] => {
  const target = rule.resolved === false ? resolved.unresolved : resolved.resolved;

  const results: IRuleResult[] = [];

  for (const given of Array.isArray(rule.given) ? rule.given : [rule.given]) {
    // don't have to spend time running jsonpath if given is $ - can just use the root object
    if (given === '$') {
      lint(
        {
          path: ['$'],
          value: target,
        },
        resolved,
        rule,
        functions,
        exceptionLocations,
        results,
      );
    } else {
      JSONPath({
        path: given,
        json: target,
        resultType: 'all',
        callback: (result: any) => {
          lint(
            {
              path: JSONPath.toPathArray(result.path),
              value: result.value,
            },
            resolved,
            rule,
            functions,
            exceptionLocations,
            results,
          );
        },
      });
    }
  }

  return results;
};

function lint(
  node: IGivenNode,
  resolved: DocumentInventory,
  rule: IRunRule,
  functions: FunctionCollection,
  exceptionLocations: IRange[] | undefined,
  results: IRuleResult[],
): void {
  try {
    for (const then of Array.isArray(rule.then) ? rule.then : [rule.then]) {
      const func = functions[then.function];
      if (!func) {
        console.warn(`Function ${then.function} not found. Called by rule ${rule.name}.`);
        continue;
      }

      const validationResults = lintNode(node, rule, then, func, resolved, exceptionLocations);

      if (validationResults.length > 0) {
        results.push(...validationResults);
      }
    }
  } catch (e) {
    console.warn(`Encountered error when running rule '${rule.name}' on node at path '${node.path}':\n${e}`);
  }
}

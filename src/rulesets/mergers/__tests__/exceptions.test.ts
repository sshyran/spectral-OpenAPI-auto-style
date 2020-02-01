import { escapeRegExp } from 'lodash';
import { RulesetExceptionCollection } from '../../../types/ruleset';
import { mergeExceptions } from '../exceptions';

describe('Ruleset exceptions merging', () => {
  const dummyRulesetUri = './ruleset.yaml';

  it('includes new exceptions', () => {
    const target: RulesetExceptionCollection = {
      'file.yaml#/a': [],
      'file.yaml#/b': ['1', '2'],
    };

    const source: RulesetExceptionCollection = {
      'file.yaml#/c': ['3'],
      'file.yaml#/d': ['4', '5'],
    };

    mergeExceptions(dummyRulesetUri, target, source);

    expect(target).toEqual({
      'file.yaml#/a': [],
      'file.yaml#/b': ['1', '2'],
      'file.yaml#/c': ['3'],
      'file.yaml#/d': ['4', '5'],
    });
  });

  it('merges existing exceptions', () => {
    const target: RulesetExceptionCollection = {
      'file.yaml#/a': [],
      'file.yaml#/b': ['1', '3'],
    };

    const source: RulesetExceptionCollection = {
      'file.yaml#/a': ['0'],
      'file.yaml#/b': ['2', '4'],
    };

    mergeExceptions(dummyRulesetUri, target, source);

    expect(target).toEqual({
      'file.yaml#/a': ['0'],
      'file.yaml#/b': ['1', '2', '3', '4'],
    });
  });

  it('deduplicates exceptions', () => {
    const target: RulesetExceptionCollection = {
      'file.yaml#/a': [],
      'file.yaml#/b': ['1', '3'],
    };

    const source: RulesetExceptionCollection = {
      'file.yaml#/a': ['0', '0'],
      'file.yaml#/b': ['2', '4', '2', '3'],
    };

    mergeExceptions(dummyRulesetUri, target, source);

    expect(target).toEqual({
      'file.yaml#/a': ['0'],
      'file.yaml#/b': ['1', '2', '3', '4'],
    });
  });

  const build = (loc: string): RulesetExceptionCollection => {
    const source = {};
    source[loc] = ['a'];
    return source;
  };

  describe('validates locations', () => {
    const invalidLocations = [
      'where',
      '123.yaml',
      '../123.yaml',
      '##where',
      '#where',
      '#',
      '#/where',
      '../123.yaml#where',
    ];

    it.each(invalidLocations)('throws when locations are not valid uris (including fragment): "%s"', async location => {
      const source = build(location);

      expect(() => {
        mergeExceptions(dummyRulesetUri, {}, source);
      }).toThrow(
        new RegExp(`.+\`${escapeRegExp(dummyRulesetUri)}\`.+\`${escapeRegExp(location)}\`.+is not a valid uri`),
      );
    });
  });

  describe('Normalization', () => {
    const relativeLocations: Array<[string, string, string]> = [
      ['./ruleset.yaml', 'one.yaml#', 'one.yaml#'],
      ['./ruleset.yaml', 'one.yaml#/', 'one.yaml#/'],
      ['./ruleset.yaml', 'one.yaml#/toto', 'one.yaml#/toto'],
      ['./ruleset.yaml', 'down/one.yaml#/toto', 'down/one.yaml#/toto'],
      ['./ruleset.yaml', '../one.yaml#/toto', '../one.yaml#/toto'],
      ['../ruleset.yaml', 'one.yaml#', '../one.yaml#'],
      ['../ruleset.yaml', 'one.yaml#/', '../one.yaml#/'],
      ['../ruleset.yaml', 'one.yaml#/toto', '../one.yaml#/toto'],
      ['../ruleset.yaml', 'down/one.yaml#/toto', '../down/one.yaml#/toto'],
      ['../ruleset.yaml', '../one.yaml#/toto', '../../one.yaml#/toto'],
      ['https://dot.com/r/ruleset.yaml', 'one.yaml#', 'https://dot.com/r/one.yaml#'],
      ['https://dot.com/r/ruleset.yaml', 'one.yaml#/', 'https://dot.com/r/one.yaml#/'],
      ['https://dot.com/r/ruleset.yaml', 'one.yaml#/toto', 'https://dot.com/r/one.yaml#/toto'],
      ['https://dot.com/r/ruleset.yaml', 'down/one.yaml#/toto', 'https://dot.com/r/down/one.yaml#/toto'],
      ['https://dot.com/r/ruleset.yaml', '../one.yaml#/toto', 'https://dot.com/one.yaml#/toto'],
    ];

    it.each(relativeLocations)(
      'combines relative locations with ruleset uri (ruleset: "%s", location: "%s")',
      (rulesetUri, location, expectedLocation) => {
        const source = build(location);
        const target = {};

        mergeExceptions(rulesetUri, target, source);

        const expected = build(expectedLocation);
        expect(target).toEqual(expected);
      },
    );

    const absoluteLocations: Array<[string, string, string]> = [
      ['./ruleset.yaml', 'https://dot.com/one.yaml#/toto', 'https://dot.com/one.yaml#/toto'],
      ['../ruleset.yaml', 'https://dot.com/one.yaml#/toto', 'https://dot.com/one.yaml#/toto'],
      ['https://dot.com/r/ruleset.yaml', 'https://dot.com/one.yaml#/toto', 'https://dot.com/one.yaml#/toto'],
      ['./ruleset.yaml', '/local/one.yaml#/toto', '/local/one.yaml#/toto'],
      ['../ruleset.yaml', '/local/one.yaml#/toto', '/local/one.yaml#/toto'],
      ['https://dot.com/r/ruleset.yaml', '/local/one.yaml#/toto', '/local/one.yaml#/toto'],
      ['./ruleset.yaml', 'c:/one.yaml#/toto', 'c:/one.yaml#/toto'],
      ['../ruleset.yaml', 'c:/one.yaml#/toto', 'c:/one.yaml#/toto'],
      ['https://dot.com/r/ruleset.yaml', 'c:/one.yaml#/toto', 'c:/one.yaml#/toto'],
      ['./ruleset.yaml', 'c:\\one.yaml#/toto', 'c:\\one.yaml#/toto'],
      ['../ruleset.yaml', 'c:\\one.yaml#/toto', 'c:\\one.yaml#/toto'],
      ['https://dot.com/r/ruleset.yaml', 'c:\\one.yaml#/toto', 'c:\\one.yaml#/toto'],
    ];

    it.each(absoluteLocations)(
      'uses absolute locations as is (ruleset: "%s", location: "%s")',
      (rulesetUri, location, expectedLocation) => {
        const source = build(location);
        const target = {};

        mergeExceptions(rulesetUri, target, source);

        const expected = build(expectedLocation);
        expect(target).toEqual(expected);
      },
    );
  });
});

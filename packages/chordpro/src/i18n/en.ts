export const chordProEn = {
  emptyChord: "Empty chord: '[]'.",
  unknownChordRoot: (chord: string) => `Unrecognized chord: "${chord}".`,
  unknownChordQuality: (chord: string) =>
    `Unrecognized chord quality in "${chord}" (assumed major).`,
  unmatchedBracketClose: "Closing ']' without a matching '['.",
  unclosedBracket: "Unclosed chord: missing ']'.",
  unclosedDirective: "Unclosed directive: missing '}'.",
  emptyDirective: "Empty directive '{}'.",
  emptyDirectiveValue: (name: string) => `'{${name}}' requires a non-empty value.`,
  missingColonSeparator: (directive: string) =>
    `Possible malformed directive (missing ':' separator): "{${directive}}".`,
  chorusRecallWithoutChorus:
    "'{chorus}' recalls the previous chorus, but no '{start_of_chorus}' precedes it.",
  nestedSection: (name: string, parentName: string, parentLine: number) =>
    `Section '${name}' was opened inside '${parentName}' (opened on line ${parentLine}) without closing the previous section.`,
  interlockedBlocks: (
    closingRaw: string,
    closingName: string,
    innerName: string,
    innerLine: number,
  ) =>
    `Improperly interlocked sections: '{${closingRaw}}' attempts to close '${closingName}', but inner section '${innerName}' (opened on line ${innerLine}) is still open.`,
  unmatchedBlockEnd: (rawName: string, name: string) =>
    `'{${rawName}}' without a matching open '${name}' section.`,
  mismatchedBlockEnd: (expected: string, line: number, found: string) =>
    `Expected closing of '${expected}' (opened on line ${line}), but found '{${found}}'.`,
  unclosedBlock: (name: string) =>
    `Section '${name}' opened here was never closed (missing matching closing directive).`,
  nonNumericValue: (name: string, value: string) =>
    `Value of '${name}' should be numeric, found "${value}".`,
  invalidTempoRange: (value: string) =>
    `Tempo value should be between 20 and 400 BPM, found "${value}".`,
  invalidCapoRange: (value: string) =>
    `Capo value must be an integer between 0 and 11, found "${value}".`,
  invalidKeyshiftValue: (value: string) =>
    `Keyshift value must be a signed integer, found "${value}".`,
  invalidTimeSignature: (value: string) =>
    `Invalid time signature format: "${value}"; use numerator/denominator (e.g. 4/4, 6/8).`,
  invalidKey: (value: string) =>
    `Invalid musical key: "${value}"; use a valid key notation (e.g. G, C#m, Bb, A minor).`,
  invalidYear: (value: string) => `Invalid year: "${value}"; use a 4-digit year (e.g. 2024).`,
  invalidDuration: (value: string) => `Invalid duration format: "${value}"; use mm:ss.`,
  invalidYoutube: (value: string) => `Invalid YouTube URL or video ID: "${value}".`,
  invalidCcli: (value: string) => `CCLI number must be numeric, found "${value}".`,
  invalidRepeat: (value: string) =>
    `Invalid repeat value: "${value}"; use a positive number (e.g. 2 or 2x).`,
  invalidSize: (name: string, value: string) => `Invalid size for '${name}': "${value}".`,
  invalidColor: (name: string, value: string) => `Invalid color for '${name}': "${value}".`,
};

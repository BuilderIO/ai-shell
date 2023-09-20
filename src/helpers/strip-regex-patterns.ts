export const stripRegexPatterns = (
  inputString: string,
  patternList: (RegExp | undefined)[]
) =>
  patternList.reduce(
    (currentString, pattern) =>
      pattern ? currentString.replaceAll(pattern, '') : currentString,
    inputString
  );

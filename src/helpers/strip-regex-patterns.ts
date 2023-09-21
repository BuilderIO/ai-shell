export const stripRegexPatterns = (
  inputString: string,
  patternList: (RegExp | string | undefined)[]
) =>
  patternList.reduce(
    (currentString: string, pattern) =>
      pattern ? currentString.replaceAll(pattern, '') : currentString,
    inputString
  );

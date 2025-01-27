const splitByWhitespacePreservingQuotedSubstringsRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;

export const tokenise = (chars: string) => {
    return chars.replaceAll("(", " ( ").replaceAll(")", " ) ")
        .match(splitByWhitespacePreservingQuotedSubstringsRegex)
        .filter(t => t !== "");
};


export type Token = {
    value: string;
    lineNumber: number;
    line: string;
}

const splitByWhitespacePreservingQuotedSubstringsRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;

export const tokeniseLine = (chars: string) => {
    return (chars.replaceAll("(", " ( ").replaceAll(")", " ) ")
        .match(splitByWhitespacePreservingQuotedSubstringsRegex) ?? [])
        .filter(t => t !== "");
};

export const tokenise = (chars: string): Token[] => {
    let tokens: Token[] = [];

    chars.split("\n").forEach((line, index) => {
        const lineTokens = tokeniseLine(line);

        for (const token of lineTokens) {
            tokens.push({
                lineNumber: index + 1,
                value: token,
                line
            });
        }
    });

    return tokens;
};




import {tokenise} from "./tokenise";

export type SchemeObject = number | string | boolean | SchemeObject[] | ((...args: SchemeObject[]) => SchemeObject);

export const parse = (code: string) => {
    let schemeObjects: SchemeObject[] = ["begin"];

    const schemeObjectsFromTokens = readFromTokens(tokenise(code));

    if (Array.isArray(schemeObjectsFromTokens) && schemeObjectsFromTokens[0] === "begin") {
        return schemeObjectsFromTokens;
    }

    schemeObjects.push(schemeObjectsFromTokens);

    return schemeObjects;
};

const readFromTokens = (tokens: string[]): SchemeObject => {
    if (tokens.length === 0) {
        throw new Error("Unexpected EOF");
    }

    const token = tokens.shift();

    if (token === "(") {
        const objectList = [];

        while (tokens[0] !== ")") {
            objectList.push(readFromTokens(tokens));
        }

        tokens.shift(); // We don't care about the )

        return objectList;
    } else if (token === ")") {
        throw new Error("Unexpected )");
    } else {
        return toAtom(token);
    }
};

const toAtom = (token: string) => {
    const num = parseFloat(token);
    if (!Number.isNaN(num)) {
        return num;
    }

    return token;
};
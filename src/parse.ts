import {tokenise} from "./tokenise";

export const Nil = null;

export type SchemeFunction = ((...args: SchemeObject[]) => SchemeObject)

/**
 * The only types that should ever exist in our scheme env or which a scheme function can return.
 */
export type SchemeObject =
    number
    | string
    | boolean
    | SchemeObject[]
    | SchemeFunction
    | typeof Nil;

export const parse = (code: string) => {
    let schemeObjects: SchemeObject[] = ["begin"];

    const tokens = tokenise(code).map(token => token.value);

    while (tokens.length > 0) {
        const schemeObjectsFromTokens = readFromTokens(tokens);
        schemeObjects.push(schemeObjectsFromTokens);
    }

    return schemeObjects;
};

const readFromTokens = (tokens: string[]): SchemeObject => {
    const token = tokens.shift();

    if (token === undefined) {
        throw new Error("Unexpected EOF");
    }

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
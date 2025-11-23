import { tokenise, Token } from "./tokenise";
import { SchemeError } from "./errors";

export const Nil = null;

export type SourceLocation = {
  lineNumber: number;
  line: string;
};

export type SchemeFunction = (...args: SchemeObject[]) => SchemeObject;

/**
 * Wrapper for identifiers to preserve source location
 */
export type SchemeIdentifier = {
  __type: "identifier";
  value: string;
  sourceLocation: SourceLocation;
};

/**
 * The only types that should ever exist in our scheme env or which a scheme function can return.
 */
export type SchemeObject =
  | number
  | string
  | boolean
  | SchemeObject[]
  | SchemeFunction
  | SchemeIdentifier
  | typeof Nil;

export const parse = (code: string) => {
  let schemeObjects: SchemeObject[] = ["begin"];

  const tokens = tokenise(code);

  while (tokens.length > 0) {
    const schemeObjectsFromTokens = readFromTokens(tokens);
    schemeObjects.push(schemeObjectsFromTokens);
  }

  return schemeObjects;
};

const readFromTokens = (tokens: Token[]): SchemeObject => {
  const token = tokens.shift();

  if (token === undefined) {
    throw new SchemeError("Unexpected EOF");
  }

  if (token.value === "(") {
    const objectList: any[] = [];
    const startToken = token;

    while (tokens[0] && tokens[0].value !== ")") {
      objectList.push(readFromTokens(tokens));
    }

    if (!tokens[0]) {
      throw new SchemeError("Unexpected EOF", {
        lineNumber: startToken.lineNumber,
        line: startToken.line,
      });
    }

    tokens.shift(); // We don't care about the )

    // Attach source location metadata to the list
    (objectList as any).__sourceLocation = {
      lineNumber: startToken.lineNumber,
      line: startToken.line,
    };

    return objectList;
  } else if (token.value === ")") {
    throw new SchemeError("Unexpected )", {
      lineNumber: token.lineNumber,
      line: token.line,
    });
  } else {
    return toAtom(token);
  }
};

const toAtom = (token: Token): SchemeObject => {
  const num = parseFloat(token.value);
  if (!Number.isNaN(num)) {
    return num;
  }

  // For string literals (quoted strings), return as is
  if (token.value.startsWith('"') || token.value.startsWith("'")) {
    return token.value;
  }

  // For identifiers, wrap with source location
  return {
    __type: "identifier",
    value: token.value,
    sourceLocation: {
      lineNumber: token.lineNumber,
      line: token.line,
    },
  };
};

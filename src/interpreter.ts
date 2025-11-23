import { Nil, SchemeFunction, SchemeObject, SchemeIdentifier } from "./parse";
import defaultEnv from "./env";
import Env from "./env";
import { zip } from "./itertools";
import { SchemeError, getSourceLocation } from "./errors";

const stringLiteralRegex = /\"([^\"\\]|\\[\s\S])*\"/;

/**
 * Check if an object is a SchemeIdentifier
 */
const isIdentifier = (obj: any): obj is SchemeIdentifier => {
  return obj && typeof obj === "object" && obj.__type === "identifier";
};

/**
 * Get the string value from a SchemeIdentifier or string
 */
const getIdentifierValue = (obj: SchemeObject): string | null => {
  if (isIdentifier(obj)) {
    return obj.value;
  }
  if (typeof obj === "string") {
    return obj;
  }
  return null;
};

/**
 * Create a closure by replacing variable names inside a function block with the values assigned to those names
 * present in the env at the point this closure is made - only replace names that aren't the
 * names of arguments passed to the function the block belongs to.
 *
 * @param argumentLabels
 * @param functionBlock
 * @param env
 */
const createClosure = (
  argumentLabels: string[],
  functionBlock: SchemeObject,
  env: typeof Env
): SchemeObject => {
  const identifierValue = getIdentifierValue(functionBlock);
  if (identifierValue && !argumentLabels.includes(identifierValue)) {
    try {
      return env.get(identifierValue);
    } catch (e) {
      return functionBlock;
      // Means it isn't in the env, cannot close variable with it
    }
  }

  if (!Array.isArray(functionBlock)) {
    return functionBlock;
  }

  return functionBlock.map((fb) => createClosure(argumentLabels, fb, env));
};

/**
 * Create a scheme function with the given name, argument labels, function block,
 * and env to be used within the function block.
 *
 * @param name
 * @param argumentLabels
 * @param functionBlock
 * @param env
 */
const createSchemeFunction = (
  name: string,
  argumentLabels: string[],
  functionBlock: SchemeObject[],
  env: typeof Env
): SchemeFunction => {
  const restIndex = argumentLabels.findIndex((item) => item === ".");
  const isRestFunction = restIndex !== -1;

  let func: (...args: SchemeObject[]) => SchemeObject;

  // Any variables that aren't arguments must be replaced with the values assigned to those variable names.
  let closedFunction = createClosure(argumentLabels, functionBlock, env);

  if (!Array.isArray(closedFunction)) {
    closedFunction = [closedFunction];
  }

  // handle ... syntax
  if (isRestFunction) {
    if (restIndex !== argumentLabels.length - 2) {
      throw new SchemeError(
        "Rest argument collector must be the last argument",
        getSourceLocation(functionBlock)
      );
    }
    const actualNumberOfArguments = argumentLabels.length - 1;
    const nonRestArgumentNames = argumentLabels.slice(
      0,
      argumentLabels.length - 2
    );
    const restArgumentName = argumentLabels[argumentLabels.length - 1];

    func = (...args: SchemeObject[]): SchemeObject => {
      if (args.length < actualNumberOfArguments) {
        throw new SchemeError(
          `function ${name} takes at least ${actualNumberOfArguments} arguments, received ${args.length}`,
          getSourceLocation(functionBlock)
        );
      }

      for (const [name, value] of zip(nonRestArgumentNames, args)) {
        env.push(name, value);
      }

      env.push(restArgumentName, args.slice(nonRestArgumentNames.length));

      let functionResult;

      closedFunction.forEach((block) => {
        functionResult = interpret(block, env);
      });

      for (const name of nonRestArgumentNames) {
        env.pop(name);
      }

      env.pop(restArgumentName);

      // @ts-ignore who cares
      if (functionResult === undefined) {
        throw new SchemeError(
          "functions must return a value",
          getSourceLocation(functionBlock)
        );
      }

      return functionResult;
    };
  } else {
    func = (...args: SchemeObject[]): SchemeObject => {
      if (args.length !== argumentLabels.length) {
        throw new SchemeError(
          `function ${name} takes ${argumentLabels.length} arguments, received ${args.length}`,
          getSourceLocation(functionBlock)
        );
      }

      for (const [name, value] of zip(argumentLabels, args)) {
        env.push(name, value);
      }

      let functionResult: SchemeObject;

      closedFunction.forEach((block) => {
        functionResult = interpret(block, env);
      });

      for (const name of argumentLabels) {
        env.pop(name);
      }

      // @ts-ignore who cares
      if (functionResult === undefined) {
        throw new SchemeError(
          "functions must return a value",
          getSourceLocation(functionBlock)
        );
      }

      return functionResult;
    };
  }

  return func;
};
/**
 * Recur through our tree of scheme objects, evaluating sub-trees and the final tree into scheme objects.
 * Basically keeps recursively evaluating a tree, replacing function calls with the resulting value in the env,
 * evaluating basic syntax like 'if's, replacing variable names with the values bound to them,
 * etc until we are left with 'leaf' values like strings, numbers etc.
 *
 * @param expression
 * @param env
 */
export const interpret = (
  expression: SchemeObject,
  env = defaultEnv
): SchemeObject => {
  if (typeof expression == "string" && stringLiteralRegex.test(expression)) {
    return expression.slice(1, -1);
  } else if (isIdentifier(expression)) {
    try {
      return env.get(expression.value);
    } catch (e) {
      throw new SchemeError(
        `Undefined variable: ${expression.value}`,
        expression.sourceLocation
      );
    }
  } else if (typeof expression === "string") {
    return env.get(expression);
  } else if (typeof expression === "number") {
    return expression;
  } else if (
    Array.isArray(expression) &&
    getIdentifierValue(expression[0]) === "if"
  ) {
    const [_, test, branchIfTrue, branchIfFalse] = expression;

    const branchToInterpret = interpret(test, env)
      ? branchIfTrue
      : branchIfFalse;

    return interpret(branchToInterpret, env);
  } else if (
    Array.isArray(expression) &&
    getIdentifierValue(expression[0]) === "cond"
  ) {
    const [_, ...conditionalBranches] = expression;

    for (const branch of conditionalBranches) {
      if (!Array.isArray(branch)) {
        throw new SchemeError(
          "cond arguments must consist of (expression expression) pairs",
          getSourceLocation(expression)
        );
      }

      const [test, branchIfTrue] = branch;

      if (getIdentifierValue(test) === "else") {
        return interpret(branchIfTrue, env);
      }

      const testResult = interpret(test, env);

      if (Boolean(testResult)) {
        return interpret(branchIfTrue, env);
      }
    }

    return Nil;
  } else if (
    Array.isArray(expression) &&
    getIdentifierValue(expression[0]) === "define"
  ) {
    const [_, name, ...functionBlockOrValue] = expression;

    let returnVal: SchemeObject;

    const nameValue = getIdentifierValue(name);
    if (nameValue) {
      returnVal = interpret(functionBlockOrValue[0], env);
      env.push(nameValue, returnVal);
    } else if (Array.isArray(name)) {
      const [functionName, ...functionArguments] = name;

      const funcNameValue = getIdentifierValue(functionName);
      if (!funcNameValue) {
        throw new SchemeError(
          "Function name must be an identifier",
          getSourceLocation(expression)
        );
      }

      const argNames = functionArguments.map(getIdentifierValue);
      if (!argNames.every((n) => n !== null)) {
        throw new SchemeError(
          `All argument names must be identifiers, received ${functionArguments}`,
          getSourceLocation(expression)
        );
      }

      returnVal = createSchemeFunction(
        funcNameValue,
        argNames as string[],
        functionBlockOrValue,
        env
      );
      env.push(funcNameValue, returnVal);
    } else {
      throw new SchemeError(
        `${String(name)} is not an variable name or a function signature`,
        getSourceLocation(expression)
      );
    }

    return returnVal;
  } else if (
    Array.isArray(expression) &&
    getIdentifierValue(expression[0]) === "lambda"
  ) {
    const [_, functionArguments, functionBlock, ...anymoreArgs] = expression;

    let returnVal: SchemeObject;

    if (!Array.isArray(functionArguments)) {
      throw new SchemeError(
        "Argument label list must follow lambda",
        getSourceLocation(expression)
      );
    }

    if (!Array.isArray(functionBlock)) {
      throw new SchemeError(
        "Lambda definition must follow argument label list",
        getSourceLocation(expression)
      );
    }

    const argNames = functionArguments.map(getIdentifierValue);
    if (!argNames.every((n) => n !== null)) {
      throw new SchemeError(
        `All argument names must be identifiers, received ${functionArguments}`,
        getSourceLocation(expression)
      );
    }

    return createSchemeFunction(
      "lambda",
      argNames as string[],
      [functionBlock],
      env
    );
  } else if (
    Array.isArray(expression) &&
    getIdentifierValue(expression[0]) === "let"
  ) {
    if (expression.length !== 3) {
      throw new SchemeError(
        "Let binding must consist of a list of definition pairs and a statement list",
        getSourceLocation(expression)
      );
    }
    const [definitionBlock, functionBlock] = expression.slice(1);

    if (!Array.isArray(definitionBlock)) {
      throw new SchemeError(
        "A list of definition pairs must follow 'let'",
        getSourceLocation(expression)
      );
    }

    definitionBlock.forEach((definition) => {
      if (!Array.isArray(definition) || definition.length !== 2) {
        throw new SchemeError(
          "Definition in let binding must consist of a name value pair",
          getSourceLocation(expression)
        );
      }

      const [name, value] = definition;

      const nameValue = getIdentifierValue(name);
      if (!nameValue) {
        throw new SchemeError(
          "Let definition name must be an identifier",
          getSourceLocation(expression)
        );
      }

      env.push(nameValue, interpret(value, env));
    });

    const returnValue = interpret(functionBlock, env);

    definitionBlock.forEach((definition) => {
      if (!Array.isArray(definition) || definition.length !== 2) {
        throw new SchemeError(
          "Definition in let binding must consist of a name value pair",
          getSourceLocation(expression)
        );
      }

      const [name] = definition;

      const nameValue = getIdentifierValue(name);
      if (!nameValue) {
        throw new SchemeError(
          "Let definition name must be an identifier",
          getSourceLocation(expression)
        );
      }

      env.pop(nameValue);
    });

    return returnValue;
  } else if (Array.isArray(expression)) {
    const procName = expression[0];

    const proc =
      typeof procName === "function" ? procName : interpret(procName, env);

    const procArguments: SchemeObject = expression
      .slice(1)
      .map((exp: SchemeObject): SchemeObject => interpret(exp));

    if (typeof proc !== "function") {
      throw new SchemeError(
        `First value in a function call exp must be a function, got ${String(
          proc
        )}`,
        getSourceLocation(expression)
      );
    }

    const s = proc(...procArguments);

    return s;
  } else if (typeof expression === "function") {
    return expression;
  }

  return Nil;
};

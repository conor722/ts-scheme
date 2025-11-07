import {Nil, SchemeFunction, SchemeObject} from "./parse";
import defaultEnv from "./env";
import Env from "./env";
import {zip} from "./itertools";

const stringLiteralRegex = /\"([^\"\\]|\\[\s\S])*\"/;

/**
 * Create a closure by replacing variable names inside a function block with the values assigned to those names
 * present in the env at the point this closure is made - only replace names that aren't the
 * names of arguments passed to the function the block belongs to.
 *
 * @param argumentLabels
 * @param functionBlock
 * @param env
 */
const createClosure = (argumentLabels: string[], functionBlock: SchemeObject, env: typeof Env): SchemeObject => {
    if (typeof functionBlock === "string" && !argumentLabels.includes(functionBlock)) {
        try {
            return env.get(functionBlock);
        } catch (e) {
            return functionBlock;
            // Means it isn't in the env, cannot close variable with it
        }
    }

    if (!Array.isArray(functionBlock)) {
        return functionBlock;
    }

    return functionBlock.map(fb => createClosure(argumentLabels, fb, env));
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
const createSchemeFunction = (name: string, argumentLabels: string[], functionBlock: SchemeObject[], env: typeof Env): SchemeFunction => {
    const restIndex = argumentLabels.findIndex(item => item === ".");
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
            throw new Error("Rest argument collector must be the last argument");
        }
        const actualNumberOfArguments = argumentLabels.length - 1;
        const nonRestArgumentNames = argumentLabels.slice(0, argumentLabels.length - 2);
        const restArgumentName = argumentLabels[argumentLabels.length - 1];

        func = (...args: SchemeObject[]): SchemeObject => {
            if (args.length < actualNumberOfArguments) {
                throw new Error(`function ${name} takes at least ${actualNumberOfArguments} arguments, received ${args.length}`);
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
                throw new Error("functions must return a value");
            }

            return functionResult;
        };
    } else {
        func = (...args: SchemeObject[]): SchemeObject => {
            if (args.length !== argumentLabels.length) {
                throw new Error(`function ${name} takes ${argumentLabels.length} arguments, received ${args.length}`);
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
                throw new Error("functions must return a value");
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
export const interpret = (expression: SchemeObject, env = defaultEnv): SchemeObject => {
    if (typeof expression == "string" && stringLiteralRegex.test(expression)) {
        return expression.slice(1, -1);
    } else if (typeof expression === "string") {
        return env.get(expression);
    } else if (typeof expression === "number") {
        return expression;
    } else if (Array.isArray(expression) && expression[0] === "if") {
        const [_, test, branchIfTrue, branchIfFalse] = expression;

        const branchToInterpret = interpret(test, env) ? branchIfTrue : branchIfFalse;

        return interpret(branchToInterpret, env);
    } else if (Array.isArray(expression) && expression[0] === "cond") {
        const [_, ...conditionalBranches] = expression;

        for (const branch of conditionalBranches) {
            if (!Array.isArray(branch)) {
                throw new Error("cond arguments must consist of (expression expression) pairs");
            }

            const [test, branchIfTrue] = branch;

            if (test === "else") {
                return interpret(branchIfTrue, env);
            }

            const testResult = interpret(test, env);

            if (Boolean(testResult)) {
                return interpret(branchIfTrue, env);
            }
        }

        return Nil;
    } else if (Array.isArray(expression) && expression[0] === "define") {
        const [_, name, ...functionBlockOrValue] = expression;

        let returnVal: SchemeObject;

        if (typeof name === "string") {
            returnVal = interpret(functionBlockOrValue[0], env);
            env.push(name, returnVal);
        } else if (Array.isArray(name)) {
            const [functionName, ...functionArguments] = name;

            if (typeof functionName !== "string") {
                throw new Error("Function name must be a string");
            }

            if (!functionArguments.every(name => typeof name === "string")) {
                throw new Error(`All argument names must be strings, received ${functionArguments}`);
            }

            returnVal = createSchemeFunction(functionName, functionArguments, functionBlockOrValue, env);
            env.push(functionName, returnVal);
        } else {
            throw new Error(`${String(name)} is not an variable name or a function signature`);
        }

        return returnVal;
    } else if (Array.isArray(expression) && expression[0] === "lambda") {
        const [_, functionArguments, functionBlock, ...anymoreArgs] = expression;

        let returnVal: SchemeObject;

        if (!Array.isArray(functionArguments)) {
            throw new Error("Argument label list must follow lambda");
        }

        if (!Array.isArray(functionBlock)) {
            throw new Error("Lambda definition must follow argument label list");
        }

        if (!functionArguments.every(name => typeof name === "string")) {
            throw new Error(`All argument names must be strings, received ${functionArguments}`);
        }

        return createSchemeFunction("lambda", functionArguments, [functionBlock], env);
    } else if (Array.isArray(expression) && expression[0] === "let") {
        if (expression.length !== 3) {
            throw new Error("Let binding must consist of a list of definition pairs and a statement list");
        }
        const [definitionBlock, functionBlock] = expression.slice(1);

        if (!Array.isArray(definitionBlock)) {
            throw new Error("A list of definition pairs must follow 'let'");
        }

        definitionBlock.forEach(definition => {
            if (!Array.isArray(definition) || definition.length !== 2) {
                throw new Error("Definition in let binding must consist of a name value pair");
            }

            const [name, value] = definition;

            if (typeof name !== "string") {
                throw new Error("Let definition name must be a string");
            }

            env.push(name, interpret(value, env));
        });

        const returnValue = interpret(functionBlock, env);

        definitionBlock.forEach(definition => {
            if (!Array.isArray(definition) || definition.length !== 2) {
                throw new Error("Definition in let binding must consist of a name value pair");
            }

            const [name] = definition;

            if (typeof name !== "string") {
                throw new Error("Let definition name must be a string");
            }

            env.pop(name);
        });

        return returnValue;
    } else if (Array.isArray(expression)) {
        const procName = expression[0];

        const proc = typeof procName === "function" ? procName : interpret(procName, env);

        const procArguments: SchemeObject = expression.slice(1).map(
            (exp: SchemeObject): SchemeObject => interpret(exp)
        );

        if (typeof proc !== "function") {
            throw new Error(`First value in a function call exp must be a function, got ${String(proc)}`);
        }

        const s = proc(...procArguments);

        return s;
    } else if (typeof expression === "function") {
        return expression;
    }

    return Nil;
};
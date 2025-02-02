import {SchemeObject} from "./parse";
import defaultEnv from "./env";
import {zip} from "./itertools";

const stringLiteralRegex = new RegExp("\"([^\"\\]|\\[\s\S])*\"");

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
    } else if (Array.isArray(expression) && expression[0] === "define") {
        const [_, name, value] = expression;

        if (typeof name === "string") {
            env.push(name, interpret(value, env));
        } else if (Array.isArray(name)) {
            const [functionName, ...functionArguments] = name;

            if (typeof functionName !== "string") {
                throw new Error("Function name must be a string");
            }

            if (!functionArguments.every(name => typeof name === "string")) {
                throw new Error(`All argument names must be strings, received ${functionArguments}`);
            }

            const restIndex = functionArguments.findIndex(item => item === ".");
            const isRestFunction = restIndex !== -1;

            let func;

            if (isRestFunction) {
                if (restIndex !== functionArguments.length - 2) {
                    throw new Error("Rest argument collector must be the last argument");
                }
                const actualNumberOfArguments = functionArguments.length - 1;
                const nonRestArgumentNames = functionArguments.slice(0, functionArguments.length - 2);
                const restArgumentName = functionArguments[functionArguments.length - 1];

                func = (...args: SchemeObject[]) => {
                    console.log("in the func", {args});
                    if (args.length < actualNumberOfArguments) {
                        throw new Error(`function ${functionName} takes at least ${actualNumberOfArguments} arguments, received ${args.length}`);
                    }

                    console.log({nonRestArgumentNames, restArgumentName});

                    for (const [name, value] of zip(nonRestArgumentNames, args)) {
                        env.push(name, value);
                    }

                    env.push(restArgumentName, args.slice(nonRestArgumentNames.length));

                    const functionResult = interpret(value, env);

                    for (const name of nonRestArgumentNames) {
                        env.pop(name);
                    }

                    env.pop(restArgumentName);

                    return functionResult;
                };
            } else {
                func = (...args: SchemeObject[]) => {
                    if (args.length !== functionArguments.length) {
                        throw new Error(`function ${functionName} takes ${functionArguments.length} arguments, received ${args.length}`);
                    }

                    for (const [name, value] of zip(functionArguments, args)) {
                        env.push(name, value);
                    }

                    const functionResult = interpret(value, env);

                    for (const name of functionArguments) {
                        env.pop(name);
                    }

                    return functionResult;
                };
            }

            env.push(functionName, func);
        } else {
            throw new Error(`${name} is not an variable name or a function signature`);
        }
    } else if (Array.isArray(expression)) {
        const proc: SchemeObject = interpret(expression[0], env);

        const procArguments: SchemeObject = expression.slice(1).map(
            (exp: SchemeObject): SchemeObject => interpret(exp)
        );

        console.log({env, expression, proc, procArguments});

        if (typeof proc !== "function") {
            throw new Error(`First value in a function call exp must be a function, got ${proc}`);
        }

        return proc(...procArguments);
    }
};
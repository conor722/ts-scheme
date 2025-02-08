import {SchemeObject} from "./parse";

const makeInfix = (fn: (a0: number, a1: number) => number) =>
    (...args: SchemeObject[]): SchemeObject =>
        args.reduce((a0: SchemeObject, a1: SchemeObject) => {
            if (typeof a0 !== "number" || typeof a1 !== "number") {
                throw new Error("All arguments to an infix math function must be numbers");
            }
            return fn(a0, a1);
        });

export const add = makeInfix((a0: number, a1: number) => a0 + a1);
export const minus = makeInfix((a0: number, b0: number) => a0 - b0);
export const multiply = makeInfix((a0: number, b0: number) => a0 * b0);
export const div = makeInfix((a0: number, b0: number) => a0 / b0);

const assertArgumentsAreNumbers = (a0: SchemeObject): a0 is number => {
    return typeof a0 === "number";
};

const assertBothArgumentsAreNumbersWrapper = <T>(fn: (fa0: number, fa1: number) => T) => (a0: SchemeObject, a1: SchemeObject): T => {
    if (assertArgumentsAreNumbers(a0) &&
        assertArgumentsAreNumbers(a1)) {
        return fn(a0, a1);
    }

    throw new Error("Both arguments to this function must be numbers");
};

export const eq = <T>(...args: T[]) => args.every(value => args[0] === value);


export const gt = assertBothArgumentsAreNumbersWrapper((a0: number, a1: number) => a0 > a1);
export const gte = assertBothArgumentsAreNumbersWrapper((a0: number, a1: number) => a0 >= a1);
export const lt = assertBothArgumentsAreNumbersWrapper((a0: number, a1: number) => a0 < a1);
export const lte = assertBothArgumentsAreNumbersWrapper((a0: number, a1: number) => a0 <= a1);

export const rshift = assertBothArgumentsAreNumbersWrapper((a0: number, a1: number) => a0 << a1);
export const lshift = assertBothArgumentsAreNumbersWrapper((a0: number, a1: number) => a0 >> a1);

export const apply = (...args: SchemeObject[]): SchemeObject => {
    const [fn, argsArray] = args;

    console.log({args});

    if (typeof fn !== "function") {
        throw new Error("First argument to 'apply' must be a function");
    }

    if (!Array.isArray(argsArray)) {
        throw new Error("Second argument to 'apply' must be an array of arguments");
    }

    return fn(...argsArray);
};

export const abs = (a0: SchemeObject) => {
    if (typeof a0 !== "number") {
        throw new Error("abs argument must be a number");
    }

    return Math.abs(a0);
};

export const cons = <T extends SchemeObject, U extends SchemeObject>(a0: T, a1: U) => [a0, a1];
export const car = (ls: SchemeObject) => {
    if (!Array.isArray(ls)) {
        throw new Error("argument to list functions must be a list");
    }

    console.log("car: ", {ls, ret: ls[0]});
    return ls[0];
};
export const cdr = (ls: SchemeObject) => {
    if (!Array.isArray(ls)) {
        throw new Error("argument to list functions must be a list");
    }

    console.log({ls, ret: ls.slice(1)});
    return ls.slice(1);
};

export const empty = (a0: SchemeObject): boolean => {
    if (Array.isArray(a0)) {
        return !Boolean(a0.length);
    }

    throw new Error("empty can only be applied to a list");
};

export const push = (a0: SchemeObject, a1: SchemeObject) => {
    if (!Array.isArray(a0)) {
        throw new Error("First argument to push must be a list");
    }

    return a0.concat([a1]);
};

export const pushLeft = (a0: SchemeObject, a1: SchemeObject) => {
    if (!Array.isArray(a0)) {
        throw new Error("First argument to push must be a list");
    }

    return [a1].concat(a0);
};

export const concat = (a0: SchemeObject, a1: SchemeObject) => {
    if (!Array.isArray(a0) || !Array.isArray(a1)) {
        throw new Error("Both arguments to extend must be lists");
    }

    console.log("concating", {a0, a1});

    return a0.concat(a1);
};
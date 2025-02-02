import {SchemeObject} from "./parse";

const makeInfix = <T>(fn: (a0: T, a1: T) => T) =>
    (...args: T[]) =>
        args.reduce((a0: T, a1: T) => fn(a0, a1));

export const add = makeInfix((a0: number, a1: number) => a0 + a1);
export const minus = makeInfix((a0: number, b0: number) => a0 - b0);
export const multiply = makeInfix((a0: number, b0: number) => a0 * b0);
export const div = makeInfix((a0: number, b0: number) => a0 / b0);

export const eq = <T>(...args: T[]) => args.every(value => args[0] === value);


export const gt = (a0: number, a1: number) => a0 > a1;
export const gte = (a0: number, a1: number) => a0 >= a1;
export const lt = (a0: number, a1: number) => a0 < a1;
export const lte = (a0: number, a1: number) => a0 <= a1;

export const rshift = (a0: number, a1: number) => a0 << a1;
export const lshift = (a0: number, a1: number) => a0 >> a1;

export const apply = <T extends SchemeObject, U extends SchemeObject>(fn: (...args: T[]) => U, args: T[]) => fn(...args);
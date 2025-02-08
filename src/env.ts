import {
    abs,
    add,
    apply,
    car,
    cdr,
    concat,
    cons,
    div,
    empty,
    eq,
    gt,
    gte,
    lshift,
    lt,
    lte,
    minus,
    multiply,
    push,
    pushLeft,
    rshift
} from "./operator";
import {SchemeObject} from "./parse";
import {println} from "./print";

const begin = (...args: SchemeObject[]) => args[args.length - 1];

const defaultEnv = new Map<string, SchemeObject>([
    ["+", add],
    ["-", minus],
    ["*", multiply],
    ["/", div],
    ["=", eq],
    [">", gt],
    [">=", gte],
    ["<", lt],
    ["<=", lte],
    ["<<", lshift],
    [">>", rshift],
    ["pi", Math.PI],
    ["begin", begin],
    ["list", (...args: SchemeObject[]) => new Array(...args)],
    ["apply", apply],
    ["print", println],
    ["cons", cons],
    ["car", car],
    ["cdr", cdr],
    ["abs", abs],
    ["empty?", empty],
    ["push", push],
    ["push-left", pushLeft],
    ["concat", concat]
]);

class Env {
    env: Map<string, SchemeObject[]>;

    constructor(env: Map<string, SchemeObject>) {
        this.env = new Map<string, SchemeObject[]>();
        for (const [key, value] of env.entries()) {
            this.env.set(key, [value]);
        }
    }

    get = (key: string) => {
        if (!this.env.has(key) || this.env.get(key)?.length === 0) {
            throw new Error(`"${key}" is not in env`);
        }

        const valueList = this.env.get(key);

        if (valueList === undefined) {
            throw new Error(`${key} is not in env`);
        }

        return valueList[valueList.length - 1];
    };

    push = (key: string, value: SchemeObject) => {
        if (!this.env.has(key)) {
            this.env.set(key, []);
        }

        this.getValueListOrThrow(key).push(value);
    };

    pop = (key: string) => {
        this.getValueListOrThrow(key).pop();
    };

    private getValueListOrThrow = (key: string) => {
        const valueList = this.env.get(key);

        if (valueList === undefined) {
            throw new Error(`${key} is not defined`);
        }

        return valueList;
    };
}


export default new Env(defaultEnv);


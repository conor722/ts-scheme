import {add, apply, div, eq, gt, gte, lshift, lt, lte, minus, multiply, rshift} from "./operator";
import {SchemeObject} from "./parse";
import {print} from "./print";

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
    ["print", print],
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
        if (!this.env.has(key) || this.env.get(key).length === 0) {
            throw new Error(`"${key}" is not in env`);
        }

        const valueList = this.env.get(key);

        return valueList[valueList.length - 1];
    };

    push = (key: string, value: SchemeObject) => {
        if (!this.env.has(key)) {
            this.env.set(key, []);
        }

        this.env.get(key).push(value);
    };

    pop = (key: string) => {
        this.env.get(key).pop();
    };
}


export default new Env(defaultEnv);


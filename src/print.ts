import {SchemeObject} from "./parse";

export const print = (...args: SchemeObject[]) => {
    console.log(...args);
    return args;
};
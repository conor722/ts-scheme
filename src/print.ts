import {SchemeObject} from "./parse";

export const println = (...args: SchemeObject[]) => {
    console.log(...args);
    return args;
};

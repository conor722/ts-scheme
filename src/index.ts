import * as readline from "node:readline";
import {interpret} from "./interpreter";
import {parse} from "./parse";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const repl = () => {
    console.log("Really simple scheme interpretation! - type 'exit' to leave");
    rl.question(`>`, input => {
        if (input === "exit") {
            return rl.close();
        }

        console.log(interpret(parse(input)));
        repl();
    });
};

repl();

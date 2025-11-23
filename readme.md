## To run the REPL:

1. `npm install`
2. `npm run build`
3. `npm start`

Most basic Scheme syntax: https://www.scheme.com/tspl2d/grammar.html should work.

## example (copy and paste to view output):

```scheme
(define (map fn args)
    (cond ((empty? args) (list))
    (else (push-left (map fn (cdr args)) (fn (car args))))))

(map (lambda (x) (* x x)) (list 1 2 3 4))
```

The above declares a function called `map` which takes a function and a list of arguments, and then applies the function to each argument in the list.

It should return a list of the squares of each number in the passed in list.

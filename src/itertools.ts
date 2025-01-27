function* zip<T, U>(array1: T[], array2: U[]): Generator<[T, U]> {
    const arrays = [array1, array2];

    for (let i = 0; i < array1.length; i++) {
        yield [array1[i], array2[i]];
    }
}

export {zip};
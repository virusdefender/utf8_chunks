interface Utf8Chunk {
    valid: string;
    invalid: Uint8Array;
}

// https://tools.ietf.org/html/rfc3629
const UTF8_CHAR_WIDTH: Uint8Array = new Uint8Array([
    // 1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 1
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 2
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 3
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 4
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 5
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 6
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 7
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 8
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 9
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // A
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // B
    0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // C
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // D
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, // E
    4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // F
]);

function utf8CharWidth(byte: number): number {
    return UTF8_CHAR_WIDTH[byte];
}

function safeGet(arr: Uint8Array, i: number): number {
    return arr[i] ?? 0;
}

class Utf8Chunks implements Iterable<Utf8Chunk> {
    private source: Uint8Array;

    constructor(source: Uint8Array) {
        this.source = source;
    }

    [Symbol.iterator](): Iterator<Utf8Chunk> {
        return new Utf8ChunksIterator(this.source);
    }
}

class Utf8ChunksIterator implements Iterator<Utf8Chunk> {
    private source: Uint8Array;

    constructor(source: Uint8Array) {
        this.source = source;
    }

    next(): IteratorResult<Utf8Chunk> {
        if (this.source.length === 0) {
            return { done: true, value: undefined };
        }

        const TAG_CONT_U8 = 128;
        let i = 0;
        let valid_up_to = 0;

        while (i < this.source.length) {
            const byte = this.source[i];
            i += 1;

            if (byte < 128) {
                // ASCII
            } else {
                const w = utf8CharWidth(byte);

                if (w === 2) {
                    if ((safeGet(this.source, i) & 192) !== TAG_CONT_U8) {
                        break;
                    }
                    i += 1;
                } else if (w === 3) {
                    const b1 = safeGet(this.source, i);
                    if (
                        !(
                            (byte === 0xE0 && b1 >= 0xA0 && b1 <= 0xBF) ||
                            (byte >= 0xE1 && byte <= 0xEC && b1 >= 0x80 && b1 <= 0xBF) ||
                            (byte === 0xED && b1 >= 0x80 && b1 <= 0x9F) ||
                            (byte >= 0xEE && byte <= 0xEF && b1 >= 0x80 && b1 <= 0xBF)
                        )
                    ) {
                        break;
                    }
                    i += 1;
                    if ((safeGet(this.source, i) & 192) !== TAG_CONT_U8) {
                        break;
                    }
                    i += 1;
                } else if (w === 4) {
                    const b1 = safeGet(this.source, i);
                    if (
                        !(
                            (byte === 0xF0 && b1 >= 0x90 && b1 <= 0xBF) ||
                            (byte >= 0xF1 && byte <= 0xF3 && b1 >= 0x80 && b1 <= 0xBF) ||
                            (byte === 0xF4 && b1 >= 0x80 && b1 <= 0x8F)
                        )
                    ) {
                        break;
                    }
                    i += 1;
                    if ((safeGet(this.source, i) & 192) !== TAG_CONT_U8) {
                        break;
                    }
                    i += 1;
                    if ((safeGet(this.source, i) & 192) !== TAG_CONT_U8) {
                        break;
                    }
                    i += 1;
                } else {
                    break;
                }
            }
            valid_up_to = i;
        }

        const inspected = this.source.subarray(0, i);
        this.source = this.source.subarray(i);
        const valid = inspected.subarray(0, valid_up_to);
        const invalid = inspected.subarray(valid_up_to);

        return {
            value: {
                valid: new TextDecoder().decode(valid),
                invalid: invalid
            },
            done: false
        };
    }
}

export { Utf8Chunks, Utf8Chunk };

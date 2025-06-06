# utf8_chunks

A TypeScript library for handling UTF-8 encoded strings, safely processing byte arrays containing invalid UTF-8 sequences.

## Features

- Splits byte arrays into valid UTF-8 strings and invalid byte sequences
- Compliant with UTF-8 encoding specification (RFC 3629)
- Provides iterator interface for processing large data streams
- Fully type-safe

## Installation

```bash
npm install utf8_chunks
```

## Usage

```typescript
import { Utf8Chunks, Utf8Chunk } from 'utf8_chunks';

// Create a byte array containing invalid UTF-8 sequences
const bytes = new Uint8Array([0x66, 0x6F, 0x6F, 0xF1, 0x80, 0x62, 0x61, 0x72]);

// Process the byte array using Utf8Chunks iterator
const chunks = new Utf8Chunks(bytes);

// Get the first chunk
const chunk = chunks.next().value;

// Get the valid UTF-8 string portion
console.log(chunk.valid); // Output: "foo"

// Get the invalid byte sequence
console.log(chunk.invalid); // Output: Uint8Array(2) [241, 128]
```

## API Reference

### `Utf8Chunk` Interface

```typescript
interface Utf8Chunk {
    valid: string;      // Valid UTF-8 string
    invalid: Uint8Array; // Invalid byte sequence
}
```

### `Utf8Chunks` Class

The `Utf8Chunks` class implements the `Iterable<Utf8Chunk>` interface for iterating over byte arrays.

```typescript
class Utf8Chunks implements Iterable<Utf8Chunk> {
    constructor(source: Uint8Array);
    [Symbol.iterator](): Iterator<Utf8Chunk>;
}
```

## Notes

- Invalid byte sequences have a maximum length of 3 bytes
- If `invalid` is empty, this is the last chunk in the string
- If `invalid` is non-empty, an unexpected byte was encountered or the input ended unexpectedly

## Note

This library is inspired by Rust's `std::str::Utf8Chunk` implementation. 

For more details about the original Rust implementation, see [Rust's Utf8Chunk documentation](https://doc.rust-lang.org/std/str/struct.Utf8Chunk.html).

## License

MIT


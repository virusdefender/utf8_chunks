import { Utf8Chunks } from './index';

describe('Utf8Chunks', () => {
  it('should handle ASCII characters', () => {
    const text = 'hello';
    const bytes = new TextEncoder().encode(text);
    const chunks = new Utf8Chunks(bytes);
    const result = Array.from(chunks);

    expect(result).toHaveLength(1);
    expect(result[0].valid).toBe(text);
    expect(result[0].invalid).toHaveLength(0);
  });

  it('should handle multi-language UTF-8 characters', () => {
    const text = 'ศไทย中华Việt Nam';
    const bytes = new TextEncoder().encode(text);
    const chunks = new Utf8Chunks(bytes);
    const result = Array.from(chunks);

    expect(result).toHaveLength(1);
    expect(result[0].valid).toBe(text);
    expect(result[0].invalid).toHaveLength(0);
  });

  it('should handle invalid UTF-8 sequences with single byte errors', () => {
    const bytes = Uint8Array.from([
      ...new TextEncoder().encode('Hello'),
      0xc2, // Invalid continuation
      ...new TextEncoder().encode(' There'),
      0xff, // Invalid byte
      ...new TextEncoder().encode(' Goodbye'),
    ]);
    const chunks = new Utf8Chunks(bytes);
    const result = Array.from(chunks);

    expect(result).toHaveLength(3);
    expect(result[0].valid).toBe('Hello');
    expect(result[0].invalid).toEqual(new Uint8Array([0xc2]));
    expect(result[1].valid).toBe(' There');
    expect(result[1].invalid).toEqual(new Uint8Array([0xff]));
    expect(result[2].valid).toBe(' Goodbye');
    expect(result[2].invalid).toHaveLength(0);
  });

  it('should handle invalid UTF-8 sequences with multi-byte errors', () => {
    const bytes = Uint8Array.from([
      ...new TextEncoder().encode('Hello'),
      0xc0,
      0x80, // Invalid 2-byte sequence
      ...new TextEncoder().encode(' There'),
      0xe6,
      0x83, // Incomplete 3-byte sequence
      ...new TextEncoder().encode(' Goodbye'),
    ]);
    const chunks = new Utf8Chunks(bytes);
    const result = Array.from(chunks);

    expect(result).toHaveLength(4);
    expect(result[0].valid).toBe('Hello');
    expect(result[0].invalid).toEqual(new Uint8Array([0xc0]));
    expect(result[1].valid).toBe('');
    expect(result[1].invalid).toEqual(new Uint8Array([0x80]));
    expect(result[2].valid).toBe(' There');
    expect(result[2].invalid).toEqual(new Uint8Array([0xe6, 0x83]));
    expect(result[3].valid).toBe(' Goodbye');
    expect(result[3].invalid).toHaveLength(0);
  });

  it('should handle 4-byte UTF-8 sequences', () => {
    const bytes = Uint8Array.from([
      0xf0,
      0x80,
      0x80,
      0x80, // Invalid 4-byte sequence
      ...new TextEncoder().encode('foo'),
      0xf0,
      0x90,
      0x80,
      0x80, // Valid 4-byte sequence (U+10000)
      ...new TextEncoder().encode('bar'),
    ]);
    const chunks = new Utf8Chunks(bytes);
    const result = Array.from(chunks);

    expect(result).toHaveLength(5);
    expect(result[0].valid).toBe('');
    expect(result[0].invalid).toEqual(new Uint8Array([0xf0]));
    expect(result[1].valid).toBe('');
    expect(result[1].invalid).toEqual(new Uint8Array([0x80]));
    expect(result[2].valid).toBe('');
    expect(result[2].invalid).toEqual(new Uint8Array([0x80]));
    expect(result[3].valid).toBe('');
    expect(result[3].invalid).toEqual(new Uint8Array([0x80]));
    expect(result[4].valid).toBe('foo\u{10000}bar');
    expect(result[4].invalid).toHaveLength(0);
  });

  it('should handle surrogate pairs', () => {
    const bytes = Uint8Array.from([
      0xed,
      0xa0,
      0x80, // Invalid surrogate pair start
      ...new TextEncoder().encode('foo'),
      0xed,
      0xbf,
      0xbf, // Invalid surrogate pair end
      ...new TextEncoder().encode('bar'),
    ]);
    const chunks = new Utf8Chunks(bytes);
    const result = Array.from(chunks);

    expect(result).toHaveLength(7);
    expect(result[0].valid).toBe('');
    expect(result[0].invalid).toEqual(new Uint8Array([0xed]));
    expect(result[1].valid).toBe('');
    expect(result[1].invalid).toEqual(new Uint8Array([0xa0]));
    expect(result[2].valid).toBe('');
    expect(result[2].invalid).toEqual(new Uint8Array([0x80]));
    expect(result[3].valid).toBe('foo');
    expect(result[3].invalid).toEqual(new Uint8Array([0xed]));
    expect(result[4].valid).toBe('');
    expect(result[4].invalid).toEqual(new Uint8Array([0xbf]));
    expect(result[5].valid).toBe('');
    expect(result[5].invalid).toEqual(new Uint8Array([0xbf]));
    expect(result[6].valid).toBe('bar');
    expect(result[6].invalid).toHaveLength(0);
  });
});

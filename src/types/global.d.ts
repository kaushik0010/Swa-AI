interface ReadableStream<R = any> {
  [Symbol.asyncIterator](): AsyncIterableIterator<T>;
}
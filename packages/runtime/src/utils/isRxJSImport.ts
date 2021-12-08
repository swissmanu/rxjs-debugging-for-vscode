const OBSERVABLE_MODULE_REGEX =
  /rxjs(\/|\\)(dist(\/|\\)|esm(\/|\\)|esm5(\/|\\)|_esm5(\/|\\)|_esm2015(\/|\\)|cjs(\/|\\))*internal(\/|\\)Observable(\.js)?$/;

/**
 * Tests if a given path is leads to RxJS' `Observable.js` file.
 *
 * @param path
 * @returns
 */
export default function isRxJSImport(path: string): boolean {
  const match = OBSERVABLE_MODULE_REGEX.exec(path);
  return match !== null;
}

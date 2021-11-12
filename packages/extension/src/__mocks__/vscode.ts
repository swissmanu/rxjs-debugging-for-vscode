/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

/**
 * This file contains a set of fragile mocks of vscode API objects. They allow us to run Jest-based unit tests for our
 * own code.
 * These are only used for unit tests. Integration tests are executed using the official extension test runner.
 */

import type { Event as EventType, EventEmitter as EventEmitterType, Uri as UriType } from 'vscode';

export class Position {
  constructor(readonly line: number, readonly character: number) {}
}

export class EventEmitter<T> implements EventEmitterType<T> {
  private listeners: ((data: T) => void)[] = [];

  event: EventType<T> = (listener) => {
    this.listeners.push(listener);
    return new Disposable(() => {});
  };

  /**
   * Notify all subscribers of the {@link EventEmitter.event event}. Failure
   * of one or more listener will not fail this function call.
   *
   * @param data The event object.
   */
  fire(data: T): void {
    for (const listener of this.listeners) {
      listener(data);
    }
  }

  /**
   * Dispose this object and free resources.
   */
  dispose(): void {}
}

export class Disposable {
  /**
   * Combine many disposable-likes into one. Use this method
   * when having objects with a dispose function which are not
   * instances of Disposable.
   *
   * @param disposableLikes Objects that have at least a `dispose`-function member.
   * @return Returns a new disposable which, upon dispose, will
   * dispose all provided disposables.
   */
  static from(...disposableLikes: { dispose: () => any }[]): Disposable {
    return new Disposable(() => {});
  }

  /**
   * Creates a new Disposable calling the provided function
   * on dispose.
   * @param callOnDispose Function that disposes something.
   */
  constructor(callOnDispose: () => void) {}

  /**
   * Dispose this object.
   */
  dispose(): void {}
}

export class Uri implements UriType {
  static parse(value: string, strict?: boolean): Uri {
    return new Uri('', '', value, '', '');
  }

  static file(path: string): Uri {
    return new Uri('', '', path, '', '');
  }

  static joinPath(base: Uri, ...pathSegments: string[]): Uri {
    return new Uri('', '', '', '', '');
  }

  static from({
    scheme,
    authority = '',
    path = '',
    query = '',
    fragment = '',
  }: {
    scheme: string;
    authority?: string;
    path?: string;
    query?: string;
    fragment?: string;
  }): Uri {
    return new Uri(scheme, authority, path, query, fragment);
  }

  private constructor(
    readonly scheme: string,
    readonly authority: string,
    readonly path: string,
    readonly query: string,
    readonly fragment: string
  ) {}

  readonly fsPath: string = '';

  with({
    scheme,
    authority,
    path,
    query,
    fragment,
  }: {
    scheme?: string;
    authority?: string;
    path?: string;
    query?: string;
    fragment?: string;
  }): Uri {
    return new Uri(
      scheme || this.scheme,
      authority || this.authority,
      path || this.path,
      query || this.query,
      fragment || this.fragment
    );
  }

  toString(skipEncoding?: boolean): string {
    return `${this.scheme}${this.authority}${this.path}${this.query}${this.fragment}`;
  }

  toJSON(): any {
    return {
      scheme: this.scheme,
      authority: this.authority,
      path: this.path,
      query: this.query,
      fragment: this.fragment,
    };
  }
}

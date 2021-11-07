import { ICommandTypes } from './commands';

export default function getMarkdownCommandWithArgs<K extends keyof ICommandTypes>(
  key: K,
  args: Parameters<ICommandTypes[K]>,
  serialize: (args: Parameters<ICommandTypes[K]>) => [string] = (args) => [JSON.stringify(args)]
): string {
  return `command:${key}?${encodeURIComponent(JSON.stringify(serialize(args)))}`;
}

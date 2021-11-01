import { ICommandTypes } from './commands';

export default function getMarkdownCommandWithArgs<K extends keyof ICommandTypes>(
  key: K,
  args: Parameters<ICommandTypes[K]>
): string {
  return `command:${key}?${encodeURIComponent(JSON.stringify(args))}`;
}

import { Commands } from '../commands/commands';
import { Configuration } from '../configuration';
import { LogLevel } from '../logger';
import executeCommand from './executeCommand';
import { TestCommands } from './testCommands';

/**
 * This is the entry point for extension-integrationtest. It provides a minimal API to interact with the extension
 * during a test run.
 */

export { executeCommand, Commands, TestCommands, Configuration, LogLevel };

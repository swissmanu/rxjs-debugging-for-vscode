export const IPosthogConfiguration = Symbol('PosthogConfiguration');

export interface IPosthogConfiguration {
  projectApiKey: string;
  host: string;
}

/**
 * Creates an `IPosthogConfiguration` using the default, global variables injected by RollupJS.
 */
export default function createPosthogConfiguration(): IPosthogConfiguration {
  return {
    host: POSTHOG_HOST,
    projectApiKey: POSTHOG_PROJECT_API_KEY,
  };
}

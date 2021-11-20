/**
 * A string containing the extensions version.
 * Provided during build through RollupJS.
 */
declare const EXTENSION_VERSION: string;

/**
 * URL/Host of the Posthog installation to track analytic events.
 * Provided during build through RollupJS.
 *
 * @see https://posthog.com/docs/integrate/server/node#options
 */
declare const POSTHOG_HOST: string;

/**
 * Posthog Project API key for tracking analytic events.
 * Provided during build through RollupJS.
 *
 * @see https://posthog.com/docs/integrate/server/node#options
 */
declare const POSTHOG_PROJECT_API_KEY: string;

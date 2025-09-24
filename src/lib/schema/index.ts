// Export all schema definitions

export * from "./analytics";
export * from "./api-keys";
export * from "./articles";
export * from "./events";
export * from "./fetched-articles";
export * from "./rss";
export * from "./translations";
export * from "./users";

import * as analyticsSchema from "./analytics";
import * as apiKeysSchema from "./api-keys";
import * as articlesSchema from "./articles";
// Re-export all tables for easier access
import * as eventsSchema from "./events";
import * as fetchedArticlesSchema from "./fetched-articles";
import * as rssSchema from "./rss";
import * as translationsSchema from "./translations";
import * as usersSchema from "./users";

export const schema = {
	...eventsSchema,
	...analyticsSchema,
	...apiKeysSchema,
	...articlesSchema,
	...fetchedArticlesSchema,
	...rssSchema,
	...translationsSchema,
	...usersSchema,
};

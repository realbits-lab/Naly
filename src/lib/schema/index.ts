// Export all schema definitions

export * from "./analytics";
export * from "./articles";
export * from "./cron";
export * from "./events";
export * from "./users";

import * as analyticsSchema from "./analytics";
import * as articlesSchema from "./articles";
import * as cronSchema from "./cron";
// Re-export all tables for easier access
import * as eventsSchema from "./events";
import * as usersSchema from "./users";

export const schema = {
	...eventsSchema,
	...analyticsSchema,
	...cronSchema,
	...articlesSchema,
	...usersSchema,
};

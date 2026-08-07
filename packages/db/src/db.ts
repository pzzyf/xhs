import type { D1Database } from "@cloudflare/workers-types";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export function createDb(database: D1Database) {
	return new Kysely({
		dialect: new D1Dialect({
			database,
		}),
	});
}

import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("action_logs", (table) => {
    table.increments("id").primary();
    table.string("action", 128).notNullable();
    table.string("message", 512).nullable();
    table.string("user_id").nullable();
    table.string("username").nullable();
    table.boolean("is_anonymous").notNullable().defaultTo(true);
    table.string("ip_address").nullable();
    table.string("resource_type").nullable();
    table.string("resource_id").nullable();
    table.string("status").nullable();
    table.text("metadata").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["action"], "idx_action_logs_action");
    table.index(["created_at"], "idx_action_logs_created_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("action_logs");
}

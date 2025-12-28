import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("container_groups", (table) => {
    table.increments("id").primary();
    table.string("name", 128).notNullable().unique();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["name"], "idx_container_groups_name");
  });

  await knex.schema.createTable("group_containers", (table) => {
    table
      .integer("group_id")
      .notNullable()
      .references("id")
      .inTable("container_groups")
      .onDelete("CASCADE");
    table.string("container_id").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.primary(["group_id", "container_id"]);
    table.index(["group_id"], "idx_group_containers_group_id");
    table.index(["container_id"], "idx_group_containers_container_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("group_containers");
  await knex.schema.dropTableIfExists("container_groups");
}

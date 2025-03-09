require("dotenv").config();
const path = require("path");
const write = require("./write");
const fileExists = require("./fileExists");
const Knex = require("knex");

// Define module-scoped variables
const dbSource = path.resolve(__dirname, "../data.db");

const knex = Knex({
  client: "better-sqlite3",
  connection: {
    filename: dbSource,
  },
  useNullAsDefault: true,
});

// Boot function that sets up the database and tables if needed
async function boot() {
  try {
    const exists = await fileExists(dbSource);
    if (!exists) {
      // Create the file.
      await write(dbSource, "");
      // Create the "groups" table.
      await knex.schema.createTable("groups", (table) => {
        table.increments("id").primary();
        table.string("name");
        table.text("containers_id");
        // Creates created_at and updated_at with defaults.
        table.timestamps(true, true);
      });
      // Create the "audit_logs" table.
      await knex.schema.createTable("audit_logs", (table) => {
        table.increments("id").primary();
        table.string("method");
        table.string("path");
        table.text("query_params");
        table.text("body");
        table.string("ip");
        table.string("user_agent");
        table.timestamp("created_at").defaultTo(knex.fn.now());
      });
    }
    // Start the log retention scheduler.
    startLogRetention();
  } catch (error) {
    console.error("Error during boot process:", error);
    throw error;
  }
}

// Inserts a new group and returns the promise.
function newGroup({ name, containers }) {
  return knex("groups")
    .insert({
      name,
      containers_id: JSON.stringify(containers),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .catch((err) => {
      console.error("Error inserting new group:", err);
      throw err;
    });
}

// Deletes a group by ID.
function deleteGroup(id) {
  return knex("groups")
    .where("id", id)
    .del()
    .catch((err) => {
      console.error("Error deleting group:", err);
      throw err;
    });
}

// Retrieves all groups.
function getGroups() {
  return knex("groups")
    .select()
    .orderBy("id", "desc")
    .catch((err) => {
      console.error("Error fetching groups:", err);
      throw err;
    });
}

// Retrieves a group by its ID.
function getGroupById(id) {
  return knex("groups")
    .select()
    .where("id", id)
    .catch((err) => {
      console.error("Error fetching group by id:", err);
      throw err;
    });
}

// Inserts a new audit log.
function createAuditLog(logData) {
  return knex("audit_logs")
    .insert({
      method: logData.method,
      path: logData.path,
      query_params: JSON.stringify(logData.query),
      body: JSON.stringify(logData.body),
      ip: logData.ip,
      user_agent: logData.userAgent,
    })
    .catch((err) => {
      console.error("Error creating audit log:", err);
      throw err;
    });
}

// Sets up a recurring job to delete audit logs older than the retention period.
function startLogRetention() {
  // Parse retention days from environment or default to 30.
  const retentionDays =
    parseInt(process.env.AUDIT_LOG_RETENTION_DAYS, 10) || 30;

  // Run cleanup every 24 hours.
  setInterval(async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      await knex("audit_logs")
        .where("created_at", "<", cutoffDate.toISOString())
        .del();

      console.log(`Cleaned up audit logs older than ${retentionDays} days`);
    } catch (error) {
      console.error("Error cleaning up audit logs:", error);
    }
  }, 24 * 60 * 60 * 1000);
}

module.exports = {
  knex,
  boot,
  newGroup,
  getGroups,
  deleteGroup,
  getGroupById,
  createAuditLog,
  startLogRetention,
};

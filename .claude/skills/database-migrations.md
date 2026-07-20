---
name: database-migrations
description: How to create and manage database migrations in this project
autoload: false
---

# Database Migrations

1. Update the schema definition.
2. Generate a migration file from the schema diff.
3. Review the generated SQL before applying it.
4. Apply the migration.

Conventions: one schema change per migration, always include a down
migration, test against a copy of production-like data, and name migrations
descriptively (e.g. `0001_add_users_email_index.sql`).

# Database Migrations

## Overview
This directory contains all database migrations applied to the Retro City Map project in chronological order.

---

## Migration Order

Migrations are numbered and must be applied in the exact order listed below:

1. `20251116233432` - Initial schema setup
2. `20251118002619` - Additional table configurations
3. `20251118170304` - Enhanced features
4. `20251118175823` - Feature updates
5. `20251118184326` - Schema refinements
6. `20251118185058` - Additional improvements
7. `20251119002425` - Feature additions
8. `20251119005913` - Updates
9. `20251119104644` - Enhancements
10. `20251119105059` - Schema updates
11. `20251119162405` - Feature improvements
12. `20251119163220` - Additional updates
13. `20251119194413` - Schema refinements
14. `20251119202805` - Feature additions
15. `20251119220143` - Updates
16. `20251119220854` - Enhancements
17. `20251120010641` - Schema updates
18. `20251120132453` - Feature improvements
19. `20251120191946` - Additional updates
20. `20251120192322` - Schema refinements
21. `20251120192800` - Feature additions
22. `20251120215213` - Updates
23. `20251123154304` - Enhancements
24. `20251123175304` - Schema updates
25. `20251123183522` - Feature improvements
26. `20251124135438` - Additional updates
27. `20251124145105` - Schema refinements
28. `20251124145931` - Feature additions
29. `20251124150318` - Updates
30. `20251124150659` - Enhancements
31. `20251124152115` - Schema updates
32. `20251125105130` - Feature improvements
33. `20251125112759` - Additional updates
34. `20251125132145` - Schema refinements
35. `20251126105155` - Latest updates

---

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_ID

# Apply all migrations
supabase db push

# Or apply specific migration
supabase migration up --file 20251116233432_bafa818b-b95f-4f25-99ca-815f42c0199a.sql
```

### Option 2: Manual Application via SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy content of migration file
3. Run the SQL
4. Repeat for each migration in order

### Option 3: Using psql

```bash
# Connect to database
psql "postgresql://postgres:[YOUR-PASSWORD]@[HOST]:6543/postgres"

# Run migration file
\i 20251116233432_bafa818b-b95f-4f25-99ca-815f42c0199a.sql

# Repeat for each file in order
```

---

## Important Notes

1. **Order Matters**: Always apply migrations in chronological order (by timestamp prefix)

2. **Check Before Running**: Review each migration file before applying to understand what changes it makes

3. **Backup First**: Always backup your database before applying migrations

4. **Idempotency**: Some migrations use `IF NOT EXISTS` clauses, but not all. Be careful about re-running migrations.

5. **Dependencies**: Later migrations may depend on earlier ones. Never skip migrations.

6. **Rollback**: If a migration fails, you may need to manually rollback changes before retrying

---

## Migration File Naming Convention

Format: `YYYYMMDDHHMMSS_uuid.sql`

- Timestamp prefix ensures correct ordering
- UUID suffix ensures uniqueness
- Extension `.sql` indicates SQL migration

---

## Verifying Migrations

After applying migrations, verify:

1. **Check tables exist**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

2. **Check RLS is enabled**:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

3. **Check functions exist**:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

4. **Check triggers exist**:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

---

## Troubleshooting

### Migration fails with "relation already exists"
- Check if migration was already applied
- Some migrations are not idempotent
- May need to skip or modify migration

### Migration fails with "permission denied"
- Ensure you're using correct database credentials
- Check user has sufficient privileges (SUPERUSER or owner)

### Migration fails with "function does not exist"
- Ensure previous migrations were applied successfully
- Check migration order

### Migration fails with "type does not exist"
- Ensure enum types were created in earlier migrations
- Check migration dependencies

---

## Complete Migration

For a fresh Supabase project, instead of applying migrations individually, you can:

1. Use the complete `schema.sql` file from project-export root
2. This includes all changes from all migrations combined
3. Then apply RLS policies from `rls-policies/` folder

---

## Migration History Tracking

Supabase automatically tracks applied migrations in:
```sql
SELECT * FROM supabase_migrations.schema_migrations;
```

This table records:
- Migration version (timestamp)
- Migration name
- Execution time

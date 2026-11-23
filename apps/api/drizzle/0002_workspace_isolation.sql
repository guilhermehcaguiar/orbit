ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY account_owner ON profiles
  USING (id = nullif(current_setting('orbit.user_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('orbit.user_id', true), '')::uuid);
--> statement-breakpoint
DO $$
DECLARE
  relation text;
BEGIN
  FOREACH relation IN ARRAY ARRAY[
    'workspace_preferences', 'semesters', 'subjects', 'tasks', 'assessments',
    'calendar_events', 'class_schedules', 'availability_windows', 'focus_sessions'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', relation);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', relation);
    EXECUTE format(
      'CREATE POLICY account_owner ON %I USING (user_id = nullif(current_setting(''orbit.user_id'', true), '''')::uuid) WITH CHECK (user_id = nullif(current_setting(''orbit.user_id'', true), '''')::uuid)',
      relation
    );
  END LOOP;
END
$$;

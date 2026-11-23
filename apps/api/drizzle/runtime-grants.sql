-- Execute as the migration operator. Set orbit_runtime to the runtime role before including this file.
GRANT USAGE ON SCHEMA public TO :"orbit_runtime";
GRANT SELECT, INSERT ON profiles, account_credentials TO :"orbit_runtime";
GRANT SELECT, INSERT, DELETE ON account_sessions TO :"orbit_runtime";
GRANT SELECT, INSERT, UPDATE, DELETE
ON workspace_preferences, semesters, subjects, tasks, assessments, calendar_events,
   class_schedules, availability_windows, focus_sessions TO :"orbit_runtime";

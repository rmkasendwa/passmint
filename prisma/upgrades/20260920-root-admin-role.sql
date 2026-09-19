BEGIN;

ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'root_admin';

COMMIT;

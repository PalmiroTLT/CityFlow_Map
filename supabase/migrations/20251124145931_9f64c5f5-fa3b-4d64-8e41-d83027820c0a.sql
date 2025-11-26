-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Delete old password hash
DELETE FROM admin_passwords;

-- Insert new password hash using pgcrypto's crypt function
INSERT INTO admin_passwords (password_hash)
VALUES (crypt('VeloPug73', gen_salt('bf')));
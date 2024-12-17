-- Create a role for application developers
CREATE ROLE app_developer;

-- Create a role for read-only users
CREATE ROLE readonly_user;

-- Create specific users
CREATE USER john WITH PASSWORD 'secure_password123';
CREATE USER sarah WITH PASSWORD 'secure_password456' VALID UNTIL '2025-01-01';

-- Assign roles to users
GRANT app_developer TO john;
GRANT readonly_user TO sarah;

-- 2. Setting Up Database Permissions
-- Create a demo database and table
CREATE DATABASE security_demo;
USE security_demo;

CREATE TABLE customer_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name STRING,
    email STRING,
    sensitive_data STRING
);

-- Grant permissions to roles
-- App developer permissions
GRANT CREATE, CONNECT ON DATABASE security TO app_developer;
GRANT ALL ON TABLE customer_data TO app_developer;

-- Read-only permissions
GRANT CONNECT ON DATABASE security TO readonly_user;
GRANT SELECT ON TABLE customer_data TO readonly_user;

-- 3. Password Policy Setup
-- Set password requirements
ALTER ROLE app_developer WITH PASSWORD RULES
    PASSWORD_MIN_UPPER 2
    PASSWORD_MIN_LOWER 2
    PASSWORD_MIN_DIGIT 2
    PASSWORD_MIN_SPECIAL 1
    PASSWORD_MIN_LENGTH 12;

-- 4. Verify Security Settings
-- Check role memberships
SHOW GRANTS ON ROLE app_developer;
SHOW GRANTS ON ROLE readonly_user;

-- Check table permissions
SHOW GRANTS ON TABLE customer_data;

-- Master installer for the MySQL/MariaDB command-line client.
-- Run this from the repository root:
--   mysql -u root -p < database/08_install.sql
-- The security grants require sims_app, sims_admin, and sims_lecturer accounts
-- to exist first. Provision them with unique passwords outside source control.

SOURCE database/01_schema.sql;
SOURCE database/02_indexes.sql;
SOURCE database/03_views.sql;
SOURCE database/04_procedures.sql;
SOURCE database/05_triggers.sql;
SOURCE database/06_security.sql;
SOURCE database/07_sample_data.sql;
SOURCE database/10_programme_catalogue.sql;

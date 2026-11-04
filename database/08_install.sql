-- Master installer: run as root / unix_socket user
SOURCE /workspace/database/01_schema.sql;
SOURCE /workspace/database/02_indexes.sql;
SOURCE /workspace/database/03_views.sql;
SOURCE /workspace/database/04_procedures.sql;
SOURCE /workspace/database/05_triggers.sql;
SOURCE /workspace/database/06_security.sql;
SOURCE /workspace/database/07_sample_data.sql;
SOURCE /workspace/database/10_programme_catalogue.sql;

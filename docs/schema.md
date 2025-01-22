### issues table
- id, uuid, auto-generated
- created_at, timestamp with time zone, auto-generated
- author_id, uuid
- assigned_team, uuid
- tags, ARRAY
- title, text
- completed_at, timestamp with time zone

### labels table
- id, uuid, auto-generated
- created_at, timestamp with time zone, auto-generated
- name, text
- description, text

### messages table
- id, uuid, auto-generated
- created_at, timestamp with time zone, auto-generated
- issue_id, uuid
- uid, uuid
- content, text

### users table
- id, uuid
- email, character varying
- last_sign_in_at, timestamp with time zone
- raw_user_meta_data, jsonb
### attached_labels table
- issue_id, uuid
- label_id, uuid

### issues table
- id, uuid, auto-generated
- created_at, timestamp with time zone, auto-generated
- author_id, uuid
- title, text
- completed_at, timestamp with time zone
- number, bigint
- project_id, uuid
- embedding, USER-DEFINED

### labels table
- id, uuid, auto-generated
- name, text
- description, text
- project_id, uuid

### messages table
- id, uuid, auto-generated
- created_at, timestamp with time zone, auto-generated
- issue_id, uuid
- uid, uuid
- content, text

### project_members table
- project_id, uuid
- uid, uuid
- role, text

### projects table
- id, uuid, auto-generated
- name, text

### users table
- id, uuid, auto-generated
- email, text
- name, text
- picture, text
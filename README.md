Run the following in Supabase to get my schema:

```
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

Copy as json, then run this to generate the schema.md file:

```
let tables = {};
json.forEach(row => {
    if (!tables[row.table_name]) {
        tables[row.table_name] = `### ${row.table_name} table`;
    }

    tables[row.table_name] += `\n- ${row.column_name}, ${row.data_type}${row.column_default ? ', auto-generated' : ''}`;
});
console.log(Object.values(tables).join('\n\n'));
```
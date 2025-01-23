const { createClient } = require('@supabase/supabase-js');

// It is safe for these to be public
const supabase = createClient(
    'https://pokkflfmgpbgphcredjk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBva2tmbGZtZ3BiZ3BoY3JlZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNjQ3NTIsImV4cCI6MjA1MjY0MDc1Mn0.10hc4EaxG5Ji8Y-XdwSNVQOXgZLN74Kl-zhLkhevNFo',
);

const { Command } = require('commander');
const program = new Command();

program
    .name('issues')
    .description('CLI for managing issues')
    .version('0.0.1');

program.command('get')
    .description('Get an issue')
    .argument('<number>', 'The issue number')
    .action(async (number) => {
        const { data: issue } = await supabase.from('issues').select('*').eq('number', number).single();
        const { data: messages } = await supabase.from('messages').select('*, users(raw_user_meta_data)').eq('issue_id', issue.id).order('created_at', { ascending: false });
        console.log(`#${issue.number} · ${issue.title}`);
        for (const message of messages) {
            console.log(`\n\n### Message from ${message.users.raw_user_meta_data.name}\n${message.content}`);
        }
    });

program.command('list')
    .description('List all issues')
    .action(async () => {
        const { data, error } = await supabase.from('issues').select('*');
        for (const row of data) {
            console.log(`#${row.number} · ${row.title}`);
        }
    });

program.parse(process.argv);

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
        const { data: messages } = await supabase.from('messages').select('*, users(raw_user_meta_data)').eq('issue_id', issue.id).order('created_at', { ascending: true });
        let output = `#${issue.number} · ${issue.title}`;
        for (const message of messages) {
            output += `\n\n### Message from ${message.users.raw_user_meta_data.name}\n${message.content}`;
        }
        console.log(output);
    });

program.command('list')
    .description('List all issues')
    .action(async () => {
        const { data, error } = await supabase.from('issues').select('*');
        let output = data.map(row => `#${row.number} · ${row.title}`).join('\n');
        console.log(output);
    });

program.command('status')
    .description('Update the status of an issue')
    .argument('<number>', 'The issue number')
    .argument('<status>', 'The new status (open/complete)')
    .action(async (number, status) => {
        // Validate status argument
        if (status !== 'open' && status !== 'complete') {
            console.error('Status must be either "open" or "complete"');
            return;
        }

        // Update the issue
        const { error } = await supabase
            .from('issues')
            .update({ 
                completed_at: status === 'complete' ? new Date().toISOString() : null 
            })
            .eq('number', number);

        if (error) {
            console.error('Failed to update issue:', error.message);
            return;
        }

        console.log(`Issue #${number} marked as ${status}`);
    });

program.parse(process.argv);

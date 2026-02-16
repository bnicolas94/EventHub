const { createClient } = require('@supabase/supabase-js');

// Load env vars manually for this script
const supabaseUrl = 'https://iuthnbzhxcywmvsazpnq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dGhuYnpoeGN5d212c2F6cG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDYxNTgsImV4cCI6MjA4NjUyMjE1OH0.vF43PQ60_XbH-QpXIWVNCfEkpo6nRsPn-PYk7U0rm5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking tables structure...');

    // Try to insert a row to see if columns exist (and then delete it)
    const { data, error } = await supabase
        .from('tables')
        .insert({
            event_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            name: 'Test Table',
            x: 100,
            y: 100,
            shape: 'round',
            seats: 8,
            rotation: 0
        })
        .select();

    if (error) {
        console.error('Error inserting table:', error);
    } else {
        console.log('Successfully inserted table with new columns:', data);
        // Clean up
        await supabase.from('tables').delete().eq('name', 'Test Table');
    }
}

checkTables();

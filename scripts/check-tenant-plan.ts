
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iuthnbzhxcywmvsazpnq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dGhuYnpoeGN5d212c2F6cG5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0NjE1OCwiZXhwIjoyMDg2NTIyMTU4fQ.Aq7ZkPyqOXMwg-967DuUv3zjRrEuX193ckShb_0yxBQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTenants() {
    console.log('Checking tenants...');
    const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
            id,
            name,
            plan_id,
            plan:subscription_plans (
                id,
                name,
                slug
            )
        `);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Tenants:', JSON.stringify(tenants, null, 2));

    const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*');

    console.log('All Plans Details:', JSON.stringify(plans, null, 2));
}

checkTenants();

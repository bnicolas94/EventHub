const { createClient } = require('@supabase/supabase-js');

// Configuración manual para la prueba rápida
const supabaseUrl = 'https://iuthnbzhxcywmvsazpnq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dGhuYnpoeGN5d212c2F6cG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDYxNTgsImV4cCI6MjA4NjUyMjE1OH0.vF43PQ60_XbH-QpXIWVNCfEkpo6nRsPn-PYk7U0rm5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Fetching keys from first table record...');

    // Intenta obtener una fila cualquiera y lista sus keys
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columnas disponibles:', Object.keys(data[0]));
    } else {
        console.log('La tabla está vacía, no puedo inferir columnas fácilmente sin query de schema.');
        // Fallback: intenta insertar con rotation a ver si falla
        const { error: insertError } = await supabase.from('tables').insert({
            event_id: '00000000-0000-0000-0000-000000000000',
            label: 'Test',
            rotation: 0
        });

        if (insertError) {
            console.log('Error al insertar rotation:', insertError.message);
        } else {
            console.log('Insert con rotation exitoso (luego borraré).');
            await supabase.from('tables').delete().eq('label', 'Test');
        }
    }
}

checkColumns();

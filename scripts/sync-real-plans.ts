
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPlans() {
    console.log('Sincronizando planes oficiales...');

    const plans = [
        {
            slug: 'free',
            max_guests: 50,
            max_events: 1,
            storage_quota_mb: 500,
            features: {
                tables: true,
                ai_suggestions: false,
                custom_branding: false,
                csv_import: false,
                mass_communications: false,
                advanced_reports: false,
                photo_moderation: false,
                custom_domain: false,
                sms_notifications: false,
                timeline: false
            }
        },
        {
            slug: 'pro',
            max_guests: 300,
            max_events: 5,
            storage_quota_mb: 5120, // 5GB
            features: {
                tables: true,
                ai_suggestions: false,
                custom_branding: false,
                csv_import: true,
                mass_communications: false,
                advanced_reports: true,
                photo_moderation: true,
                custom_domain: false,
                sms_notifications: false,
                timeline: true
            }
        },
        {
            slug: 'enterprise',
            max_guests: 10000,
            max_events: 100,
            storage_quota_mb: 51200, // 50GB
            features: {
                tables: true,
                ai_suggestions: true,
                custom_branding: true,
                csv_import: true,
                mass_communications: true,
                advanced_reports: true,
                photo_moderation: true,
                custom_domain: true,
                sms_notifications: true,
                timeline: true
            }
        }
    ];

    for (const plan of plans) {
        console.log(`Actualizando plan: ${plan.slug}...`);
        const { error } = await supabase
            .from('subscription_plans')
            .update({
                max_guests: plan.max_guests,
                max_events: plan.max_events,
                storage_quota_mb: plan.storage_quota_mb,
                features: plan.features
            })
            .eq('slug', plan.slug);

        if (error) {
            console.error(`Error actualizando ${plan.slug}:`, error);
        } else {
            console.log(`Plan ${plan.slug} actualizado correctamente.`);
        }
    }
}

syncPlans();

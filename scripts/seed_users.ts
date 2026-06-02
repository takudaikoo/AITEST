
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const DEFAULT_PASSWORD = 'smagol01';

// --- Data ---
const USERS = [
    // Admins
    { department: '営業部', name: '小尾拓大', email: 'takudai_koo@gjb.co.jp', role: 'admin' },
    { department: 'マーケティング部', name: '廣瀬穂乃花', email: 'honoka_hirose@gjb.co.jp', role: 'admin' },
    { department: '営業部', name: '北村七海', email: 'nanami_kitamura@gjb.co.jp', role: 'admin' },

    // Users
    { department: 'コーポレート', name: '高須賀優人', email: 'yuto_takasuka@gjb.co.jp', role: 'user' },
    { department: '店舗管理部', name: '舟川敬文', email: 'takafumi_funakawa@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '髙野翔平', email: 'shohei_takano@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '高須賀直人', email: 'naoto_takasuka@gjb.co.jp', role: 'user' },
    { department: '不動産部', name: '有下遼', email: 'ryo_arishita@gjb.co.jp', role: 'user' },
    { department: 'コーポレート', name: '舟川かなえ', email: 'kanae_funakawa@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '芝﨑訓', email: 'satoru_shibasaki@gjb.co.jp', role: 'user' },
    { department: '店舗管理部', name: '大柳和輝', email: 'kazuki_oyanagi@gjb.co.jp', role: 'user' },
    { department: 'コーポレート', name: '大石明子', email: 'akiko_oishi@gjb.co.jp', role: 'user' },
    { department: '店舗管理部', name: '松島朱里', email: 'akari_matsushima@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '寺門愛真', email: 'ami_terakado@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '吉武千音', email: 'chinari_yoshitake@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '西川明日香', email: 'asuka_nishikawa@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '西村由綺江', email: 'yukie_nishimura@gjb.co.jp', role: 'user' },
    { department: 'マーケティング部', name: '白鳥翔太', email: 'shota_shiratori@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '矢萩嶺也', email: 'reiya_yahagi@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '横内鎌大', email: 'kenta_yokouchi@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '中澤順二', email: 'junji_nakazawa@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '阿部莉菜', email: 'rina_abe@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '山崎将史', email: 'masashi_yamazaki@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '牧嶋英樹', email: 'hideki_makishima@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '宮脇綺望', email: 'ayami_miyawaki@gjb.co.jp', role: 'user' },
    { department: 'コーポレート', name: '宮﨑史子', email: 'fumiko_miyazaki@gjb.co.jp', role: 'user' },
    { department: 'コーポレート', name: '髙木雅丈', email: 'masahiro_takagi@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '下条純平', email: 'junpei_shimojo@gjb.co.jp', role: 'user' },
    { department: '不動産部', name: '澁谷颯人', email: 'hayato_shibuya@gjb.co.jp', role: 'user' },
    { department: 'コーポレート', name: '野呂昂平', email: 'kohei_noro@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '福島みなみ', email: 'minami_fukushima@gjb.co.jp', role: 'user' },
    { department: '不動産部', name: '野口俊平', email: 'shumpei_noguchi@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '堀江博', email: 'hiroshi_horie@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '菊嶋勇次', email: 'yuji_kikushima@gjb.co.jp', role: 'user' },
    { department: '店舗管理部', name: '山本文哉', email: 'fumiya_yamamoto@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '竹内大貴', email: 'hiroki_takeuchi@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '岡本政三', email: 'masakazu_okamoto@gjb.co.jp', role: 'user' },
    { department: '不動産部', name: '垣花恵太郎', email: 'keitaro_kakihana@gjb.co.jp', role: 'user' },
    { department: 'マーケティング部', name: '大西優梨菜', email: 'yurina_onishi@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '舘祐樹', email: 'yuki_tachi@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '興野大将', email: 'hiromasa_kyono@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '北村七海', email: 'nanami_kitamura@gjb.co.jp', role: 'admin' }, // Duplicate check? Ah it is already listed at top.
    { department: '店舗管理部', name: '福井優陽', email: 'yuhi_fukui@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '小林優太', email: 'yuta_kobayashi@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '北村嘉基', email: 'yoshiki_kitamura@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '山田耕大', email: 'kodai_yamada@gjb.co.jp', role: 'user' },
    { department: 'マーケティング部', name: '山下雄輝', email: 'yuki_yamashita@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '角南心太郎', email: 'shintaro_sunami@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '谷口綾音', email: 'ayane_taniguchi@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '山本莉唯', email: 'rio_yamamoto@gjb.co.jp', role: 'user' },
    { department: '不動産部', name: '前原涼帆', email: 'suzuho_maehara@gjb.co.jp', role: 'user' },
    { department: 'マーケティング部', name: '城島裕美', email: 'yumi_jojima@gjb.co.jp', role: 'user' },
    { department: 'CS部', name: '春日 仁美', email: 'hitomi_kasuga@gjb.co.jp', role: 'user' },
    { department: '店舗管理部', name: '吉原 哲', email: 'tetsu_yoshihara@gjb.co.jp', role: 'user' },
    { department: '不動産部', name: '田村 優', email: 'masaru_tamura@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '于天盈', email: 'tianying_yu@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '横田駿大', email: 'hayato_yokota@gjb.co.jp', role: 'user' },
    { department: 'コーチ部', name: '山本涼真', email: 'ryoma_yamamoto@gjb.co.jp', role: 'user' },
    { department: '営業部', name: '西川良輔', email: 'smagol.ryosuke.nishikawa@gmail.com', role: 'user' },
    { department: '営業部', name: '松田 香菜子', email: 'kanako_matsuda@gjb.co.jp', role: 'user' },
    { department: '店舗管理部', name: '一藤木 十座', email: 'juza_ittogi@gjb.co.jp', role: 'user' },
];

const DEPARTMENTS = [
    'コーポレート',
    '営業部',
    '店舗管理部',
    'CS部',
    '不動産部',
    'コーチ部',
    'マーケティング部'
];

// --- Env Loader ---
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env.local not found');
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const env: Record<string, string> = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key) {
                env[key] = value;
            }
        }
    });
    console.log('Loaded env keys:', Object.keys(env));
    return env;
}

// --- Main ---
async function main() {
    const env = loadEnv();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY) in .env.local');
        console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log('🚀 Starting seed process...');

    // 1. Sync Departments
    console.log('📦 Syncing departments...');
    const deptMap = new Map<string, string>(); // Name -> ID

    for (const deptName of DEPARTMENTS) {
        const { data: existing } = await supabase
            .from('departments')
            .select('id')
            .eq('name', deptName)
            .single();

        if (existing) {
            deptMap.set(deptName, existing.id);
        } else {
            console.log(`   Creating department: ${deptName}`);
            const { data: newDept, error } = await supabase
                .from('departments')
                .insert({ name: deptName })
                .select('id')
                .single();

            if (error) {
                console.error(`   ❌ Failed to create department ${deptName}:`, error.message);
            } else {
                deptMap.set(deptName, newDept.id);
            }
        }
    }

    // 2. Sync Users
    console.log('👥 Syncing users...');
    for (const user of USERS) {
        const deptId = deptMap.get(user.department);
        if (!deptId) {
            console.warn(`   ⚠️ Department not found for user ${user.name}: ${user.department}`);
            continue;
        }

        // Check if user exists in auth
        // Note: admin.listUsers is not efficient for checking individual existence by email
        // but we can try createUser and catch error if already exists, or listUsers to find id.
        // Let's rely on createUser returning error or data.

        let userId: string | null = null;
        let isNewUser = false;

        try {
            const { data: { user: newUser }, error: createError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: DEFAULT_PASSWORD,
                email_confirm: true,
                user_metadata: { full_name: user.name }
            });

            if (createError) {
                // Assuming error means user exists, we need to find their ID
                // console.log(`   User exists (or error): ${user.email} - ${createError.message}`);
                // Fetch ID manually
                // Since we don't have getUserByEmail easily exposed without iterating/filtering (unless we use listUsers)
                // Actually listUsers supports filters? No. 
                // We'll search public.profiles if they are already synced?
                // Or just assume if create failed, we need to look them up.
                // Let's use a workaround: attempt to sign in? No, we have service role.

                // Let's try to find their profile ID from profiles table
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', user.email)
                    .single();

                if (existingProfile) {
                    userId = existingProfile.id;
                } else {
                    console.error(`   ❌ Could not find ID for existing user ${user.email}`);
                    continue;
                }
            } else if (newUser) {
                userId = newUser.id;
                isNewUser = true;
                console.log(`   ✅ Created Auth User: ${user.name}`);
            } else {
                console.error(`   ❌ Failed to create user ${user.name} (Unknown error)`);
            }
        } catch (e) {
            console.error(`   ❌ Error processing user ${user.email}`, e);
        }

        if (userId) {
            // Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: user.name,
                    department_id: deptId,
                    role: user.role,
                    // Ensure these are set if not present?
                })
                .eq('id', userId);

            if (profileError) {
                console.error(`   ❌ Failed to update profile for ${user.name}:`, profileError.message);
            } else {
                if (isNewUser) {
                    console.log(`      Updated profile info for ${user.name}`);
                } else {
                    // console.log(`      Updated profile info for existing user ${user.name}`);
                }
            }
        }
    }

    console.log('✨ Seed process complete!');
}

main().catch(console.error);

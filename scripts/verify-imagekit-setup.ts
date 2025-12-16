/**
 * ImageKit Setup Verification Script
 * 
 * This script helps verify that ImageKit is properly configured
 * Run with: npx tsx scripts/verify-imagekit-setup.ts
 */

import { getImageKit } from '../lib/config/imagekit';

async function verifyImageKitSetup() {
  console.log('🔍 Verifying ImageKit setup...\n');

  try {
    // Check environment variables
    console.log('📋 Checking environment variables...');
    const requiredVars = [
      'IMAGEKIT_PUBLIC_KEY',
      'IMAGEKIT_PRIVATE_KEY',
      'IMAGEKIT_URL_ENDPOINT'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:');
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.log('\n📝 Please add these to your .env.local file');
      console.log('   See .env.example for reference\n');
      process.exit(1);
    }

    console.log('✅ All environment variables present\n');

    // Try to initialize ImageKit
    console.log('🔧 Initializing ImageKit client...');
    const imagekit = getImageKit();
    console.log('✅ ImageKit client initialized\n');

    // Test authentication parameters generation
    console.log('🔐 Testing authentication parameters...');
    const authParams = imagekit.getAuthenticationParameters();
    if (authParams.token && authParams.expire && authParams.signature) {
      console.log('✅ Authentication parameters generated successfully\n');
    } else {
      throw new Error('Failed to generate authentication parameters');
    }

    console.log('🎉 ImageKit setup verification complete!\n');
    console.log('Next steps:');
    console.log('1. Run the database migration: psql $DATABASE_URL < scripts/create-announcement-files-table.sql');
    console.log('2. Start the development server: npm run dev');
    console.log('3. Test file upload through the Create Announcement form\n');

  } catch (error) {
    console.error('❌ ImageKit setup verification failed:');
    console.error(error instanceof Error ? error.message : error);
    console.log('\n📚 Troubleshooting:');
    console.log('- Verify your ImageKit credentials at https://imagekit.io/dashboard');
    console.log('- Check that .env.local exists and contains valid credentials');
    console.log('- Ensure no extra spaces or quotes in environment variables\n');
    process.exit(1);
  }
}

verifyImageKitSetup();

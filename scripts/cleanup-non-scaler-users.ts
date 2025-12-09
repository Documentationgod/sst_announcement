/**
 * Cleanup Script: Remove Non-Scaler Users from Database
 * 
 * This script removes all users with email addresses that don't match
 * the allowed Scaler domains (@scaler.com or @sst.scaler.com)
 * 
 * Usage:
 *   npx tsx scripts/cleanup-non-scaler-users.ts
 */

import { getDb } from '../lib/config/db';
import { users } from '../lib/schema';
import { isAllowedDomain } from '../lib/middleware/domain';

async function cleanupNonScalerUsers() {
  console.log('🔍 Starting cleanup of non-Scaler users...\n');
  
  const db = getDb();
  
  try {
    // Fetch all users
    const allUsers = await db.select().from(users);
    console.log(`📊 Total users in database: ${allUsers.length}`);
    
    // Filter non-Scaler users
    const nonScalerUsers = allUsers.filter(user => !isAllowedDomain(user.email));
    
    if (nonScalerUsers.length === 0) {
      console.log('✅ No non-Scaler users found. Database is clean!');
      return;
    }
    
    console.log(`\n⚠️  Found ${nonScalerUsers.length} non-Scaler users:`);
    nonScalerUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    console.log('\n🗑️  Deleting non-Scaler users...');
    
    // Delete each non-Scaler user
    let deletedCount = 0;
    for (const user of nonScalerUsers) {
      try {
        await db.delete(users).where(eq(users.id, user.id!));
        deletedCount++;
        console.log(`   ✓ Deleted: ${user.email}`);
      } catch (error) {
        console.error(`   ✗ Failed to delete ${user.email}:`, error);
      }
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} out of ${nonScalerUsers.length} non-Scaler users.`);
    
    // Show remaining user count
    const remainingUsers = await db.select().from(users);
    console.log(`📊 Remaining users in database: ${remainingUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Import eq function
import { eq } from 'drizzle-orm';

// Run the cleanup
cleanupNonScalerUsers()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

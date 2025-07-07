/**
 * Script to get actual UIDs from Firebase Auth Emulator
 */

const fetch = require('node-fetch');

// Configuration
const EMULATOR_HOST = 'localhost';
const AUTH_PORT = 9099;
const PROJECT_ID = 'demo-unionspace-crm';

// Get all users from Auth emulator
async function getAllUsers() {
  const url = `http://${EMULATOR_HOST}:${AUTH_PORT}/emulator/v1/projects/${PROJECT_ID}/accounts`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Main function
async function checkAuthUsers() {
  console.log('🔍 Checking Firebase Auth Emulator users...');
  console.log('===============================================');
  
  const users = await getAllUsers();
  
  if (users.length === 0) {
    console.log('❌ No users found in Auth emulator');
    return;
  }
  
  console.log(`✅ Found ${users.length} users in Auth emulator:`);
  console.log('');
  
  users.forEach((user, index) => {
    console.log(`👤 User ${index + 1}:`);
    console.log(`   UID: ${user.localId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${new Date(parseInt(user.createdAt)).toLocaleString()}`);
    console.log('');
  });
  
  return users;
}

// Run the check
checkAuthUsers();
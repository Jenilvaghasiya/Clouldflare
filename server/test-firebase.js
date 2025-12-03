import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Firebase Admin SDK Configuration...\n');

console.log('📋 Current Configuration:');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('Private Key:', process.env.FIREBASE_PRIVATE_KEY ? '✓ Present' : '✗ Missing');
console.log('');

try {
  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  console.log('✅ Firebase Admin initialized successfully!\n');

  // Test getting a user
  console.log('🔍 Testing user lookup...');
  console.log('Enter a test email to check (or press Ctrl+C to skip):\n');

  // For automated testing, try to list users
  const listUsersResult = await admin.auth().listUsers(5);
  
  if (listUsersResult.users.length > 0) {
    console.log(`✅ SUCCESS! Found ${listUsersResult.users.length} users in Firebase:\n`);
    listUsersResult.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || 'No email'} (UID: ${user.uid})`);
    });
    console.log('\n🎉 Firebase Admin SDK is working correctly!');
    console.log('✨ You can now use the forgot password feature.\n');
  } else {
    console.log('⚠️  No users found in Firebase.');
    console.log('💡 Add a user in Firebase Console to test.\n');
  }

} catch (error) {
  console.error('❌ ERROR: Firebase Admin SDK failed to initialize\n');
  console.error('Error details:', error.message);
  console.error('\n💡 Common issues:');
  console.error('   1. FIREBASE_CLIENT_EMAIL is incorrect or placeholder');
  console.error('   2. FIREBASE_PRIVATE_KEY is malformed');
  console.error('   3. Service account doesn\'t have proper permissions');
  console.error('\n📝 How to fix:');
  console.error('   1. Go to https://console.firebase.google.com/');
  console.error('   2. Select project: admin-wordwave');
  console.error('   3. Settings → Service Accounts');
  console.error('   4. Click "Generate New Private Key"');
  console.error('   5. Download the JSON file');
  console.error('   6. Copy values from JSON to .env file\n');
  process.exit(1);
}

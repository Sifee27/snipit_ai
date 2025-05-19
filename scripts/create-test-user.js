// Script to create a test user with proper bcrypt hashing
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Test user details
const testUser = {
  id: "user_123",
  email: "test@example.com",
  name: "Test User",
  plan: "pro",
  createdAt: new Date().toISOString(),
  usageCount: 0,
  maxUsage: 999 // Pro plan gets unlimited usage
};

// Hash the password properly
async function createTestUser() {
  try {
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Full user with password
    const userWithPassword = {
      ...testUser,
      password: hashedPassword
    };
    
    // Read existing users if any
    let users = [];
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
      
      // Remove existing test user if any
      users = users.filter(u => u.email !== testUser.email);
    } catch (error) {
      console.log('No existing users file or empty file');
    }
    
    // Add our test user
    users.push(userWithPassword);
    
    // Write back to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

// Run the function
createTestUser();

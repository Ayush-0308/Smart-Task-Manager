/**
 * Run: node scripts/generatePasswordHash.js
 * Generates bcrypt hash for sample users in schema.sql
 */
const bcrypt = require('bcryptjs');

const password = 'password123';
bcrypt.genSalt(10, (err, salt) => {
  bcrypt.hash(password, salt, (err, hash) => {
    console.log('Password:', password);
    console.log('Hash:', hash);
  });
});

const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcyMWVjNS1kMDdlLTQ4ZmItYmRhMC0wYjZlZjRlZGUzOTMiLCJ0eXBlIjoiYWNjZXNzIiwibm9uY2UiOiJlMjYzZDYxMWU3Y2U0NzM5Nzc5NTM1ZDQ5ZmJlYzE2NiIsImlhdCI6MTc1NzUxMzc4NCwiZXhwIjoxNzU3NTE0Njg0fQ.PkpjJHFlsZAZaYXx8l3IzPfZOkNJcAL7naKD8jxmS6c";
const secret = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

try {
  const decoded = jwt.verify(token, secret);
  console.log("Token is valid:", decoded);
} catch (error) {
  console.log("Token verification failed:", error.message);
}

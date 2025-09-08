# IINSAF Platform Backend

This is the backend API for the IINSAF platform that serves the frontend React application.

## Role-Based Authentication System Update

### Why This Update Was Needed

The platform supports multiple user types (Admin, Reporter, Advertiser, Raise Your Voice users) with different permissions and access levels. The previous authentication system had several limitations:

1. **Inconsistent Authentication Logic**: Different user types had different authentication flows
2. **Limited Role Checking**: No unified way to verify user roles and permissions
3. **Security Vulnerabilities**: Token validation and role verification were not consistently applied

### Key Backend Changes

1. **Unified Role-Based Middleware (`roleAuth.js`)**:
   - Created a flexible middleware that handles all user types
   - Supports role-specific access control with a single middleware
   - Handles different token formats from various user types
   - Automatically detects user type from token payload

2. **Enhanced JWT Token Structure**:
   - Added role information to JWT tokens
   - Standardized token format across user types
   - Added expiration time for better security
   - Included necessary user information for frontend use

3. **Updated Authentication Middlewares**:
   - Improved `adminAuthenticate.js` to verify admin roles
   - Enhanced `userAuthenticate.js` with role verification
   - Updated `ryvUserAuthenticate.js` for Raise Your Voice users
   - Added proper error handling and logging

4. **Consistent API Responses**:
   - Standardized login response format with user details and role information
   - Improved error handling and messaging
   - Added consistent response structure across all authentication endpoints

### Technical Implementation Details

#### Role-Based Authentication Middleware

The new `roleAuth.js` middleware:
- Verifies JWT tokens
- Extracts user role from token
- Checks if user has required role(s)
- Adds user information to request object
- Handles different user models (Admin, User, RYV User)

#### JWT Token Structure

```javascript
// User token structure
const payload = {
  userId: {
    id: user._id,
  },
  role: user.role,
};

// Admin token structure
const payload = {
  adminId: admin._id,
  role: admin.role,
  assignedSections: admin.assignedSections || []
};

// RYV user token structure
const payload = {
  userId: ryvUser._id,
  role: 'ryvuser'
};
```

#### Authentication Flow

1. User submits credentials
2. Backend validates credentials
3. Backend generates JWT with role information
4. Frontend stores token and user data
5. Protected routes check user role before allowing access

## Getting Started

```bash
npm install
npm start
```

## API Endpoints

### Authentication

- `POST /login` - User login
- `POST /admin/login` - Admin login
- `POST /raise/verify/otp/login` - RYV user login

### Protected Routes

All protected routes now use the role-based middleware to verify access:

```javascript
const roleAuth = require('../middlewares/userAuthenticate/roleAuth');

// Example of a protected route with role check
router.get('/protected-resource', roleAuth(['Reporter', 'Advertiser']), (req, res) => {
  // Only users with Reporter or Advertiser role can access this
});
```

## Environment Variables

The following environment variables are required:

- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRES_IN` - Token expiration time (e.g., "7d")
- `EMAIL_USER` - Email for sending notifications
- `EMAIL_PASS` - Password for email account

## File Upload Configuration

The application is configured to handle larger file uploads:

- **Maximum File Size**: 300MB per file
- **Supported File Types**: Images (JPEG, PNG) and Videos (MP4, MPEG)
- **Error Handling**: Proper error messages for file size and type validation
- **Body Parser Limits**: Increased to 300MB for JSON and URL-encoded data

If you need to adjust these limits:
1. Modify the `fileSize` parameter in `middlewares/multer/multer.js`
2. Update the `limit` parameter in `express.json()` and `express.urlencoded()` in `index.js`

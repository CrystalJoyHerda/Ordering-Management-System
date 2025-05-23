# Role-Based Access Control (RBAC) Implementation Guide

## Overview
This document explains the RBAC implementation for the Byte & Beans Ordering Management System, including authentication flow, role-based authorization, and dashboard access.

## Key Components

### 1. Authentication Flow
- **Login Process**: Users authenticate through loginInterface.html
- **Token Storage**: JWT tokens stored in localStorage
- **Auto Redirect**: Users are redirected to their role-specific dashboard after successful login
- **Pre-Auth Check**: All pages include auth-check.js which validates authentication before page loads

### 2. RBAC Service (rbac.js)
- **Role Hierarchy**: Admin (level 3) > Manager (level 2) > Cashier (level 1)
- **Permission Logic**: Each role has specific resources they can access
- **Access Enforcement**: Pages use enforcePageAccess() to verify user authorization
- **Token Parsing**: Service extracts user role from JWT token

### 3. Path Resolution
- **Smart Path Detection**: System detects current location to calculate correct relative paths
- **Consistent Redirects**: Login and dashboard redirects work from any location in the app

## Implementation Guides

### Adding RBAC to a New Page
1. Include the required scripts in your HTML header:
```html
<!-- Auth check script - redirects to login if not authenticated -->
<script src="../js/auth-check.js"></script>
<!-- RBAC service - for role-based restrictions -->
<script src="../js/rbac.js"></script>
<!-- Logout helper - for consistent logout behavior -->
<script src="../js/logout-helper.js"></script>
```

2. Enforce role-based access in your page's JavaScript:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // For single role access:
    RBACService.enforcePageAccess('admin');
    
    // Or for multiple roles:
    RBACService.enforcePageAccess(['admin', 'manager']);
});
```

3. Hide/show UI elements based on role:
```html
<!-- This element will only be visible to admins -->
<div data-role-access="admin">Admin-only content</div>

<!-- This element will be visible to both admins and cashiers -->
<div data-role-access="admin,cashier">Shared content</div>
```

4. Add the logout button with the shared handler:
```javascript
document.querySelector('.logout-btn').addEventListener('click', function() {
    if (typeof window.handleLogout === 'function') {
        window.handleLogout();
    } else {
        // Fallback if logout handler isn't loaded
        handleLogoutFallback();
    }
});
```

## Troubleshooting

### Common Issues
1. **Path Problems**: If redirects fail, check if path detection is working correctly for your page structure
2. **Token Issues**: Invalid or expired tokens are cleared automatically - the user will be redirected to login
3. **Permission Denials**: Users will be redirected to their appropriate dashboard if they try to access unauthorized pages

### Testing
To test the RBAC implementation:
1. Login with different user roles
2. Try accessing pages not permitted for your role
3. Test logout functionality from different pages
4. Verify that direct URL access to protected pages redirects properly

## Security Notes
- JWT tokens should be configured with appropriate expiration
- Server-side validation should always be implemented as well
- Role enforcement must happen both on client and server side

## Logout Implementation

### Consistent Logout Behavior
The system implements a consistent logout process across all pages through these components:

1. **Central Logout Helper**: `logout-helper.js` provides a standardized `handleLogout()` function
2. **Session Cleanup**: Logout removes the auth token and any user session data
3. **Smart Path Resolution**: Redirects to the login page regardless of current location
4. **API Communication**: Notifies the backend about logout for proper session termination

### Fallback Strategy
Every page also implements a fallback logout function in case the central helper isn't loaded:
```javascript
function handleLogoutFallback() {
    if (confirm('Are you sure you want to logout?')) {
        // Clean up tokens and session data
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('user');
        
        // Path-aware redirect to login
        const pathname = window.location.pathname.toLowerCase();
        if (pathname.includes('/pages/')) {
            window.location.href = 'loginInterface.html';
        } else {
            window.location.href = 'pages/loginInterface.html';
        }
    }
}
```

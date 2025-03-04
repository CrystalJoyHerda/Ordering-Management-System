
package myPackage;


public class SessionManager {
    private static String loggedInUser = null;
    private static String role = null;
    
    // Set user session after login
    public static void setUser(String username, String userRole) {
        loggedInUser = username;
        role = userRole;
    }
    
    // Check if a user is logged in
    public static boolean isLoggedIn() {
        return loggedInUser != null;
    }

    // Get logged-in user
    public static String getUser() {
        return loggedInUser;
    }

    // Get role of logged-in user
    public static String getRole() {
        return role;
    }

    // Clear session on logout
    public static void logout() {
        loggedInUser = null;
        role = null;
        System.out.println("Logged out successfully!");
    }
}

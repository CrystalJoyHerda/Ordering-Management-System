package myPackage;

public class SessionManager {
    private static String loggedInUser = null;
    private static String role = null;

    public static void setUser(String empId, String userRole) {
        loggedInUser = empId;
        role = userRole;
    }

    public static boolean isLoggedIn() {
        return loggedInUser != null;
    }

    public static String getUser() {
        return loggedInUser;
    }

    public static String getRole() {
        return role;
    }

    public static void logout() {
        loggedInUser = null;
        role = null;
        System.out.println("Logged out successfully!");
    }
}

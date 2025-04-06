package myPackager;

import java.util.Scanner;

public class AdminDashboard {
     private final ManageEmployees manageEmployees; 

    public AdminDashboard(ManageEmployees manageEmployees) {
        this.manageEmployees = manageEmployees;
    }

    public void showDashboard(Scanner scanner) {
        while (SessionManager.isLoggedIn()) {
            System.out.println("\n======== ADMIN DASHBOARD ========");
            System.out.println("1. Manage Employees");
            System.out.println("2. View Sales");
            System.out.println("3. View Stocks");
            System.out.println("4. Log Out");
            System.out.print("Enter choice: ");

            int choice = scanner.nextInt();
            scanner.nextLine(); 

            switch (choice) {
                case 1:
                    manageEmployees.showManageEmployeesMenu(scanner); // ✅ Delegates to ManageEmployees
                    break;
                case 2:
                    viewSales();
                    break;
                case 3:
                    viewStocks();
                    break;
                case 4:
                    SessionManager.logout();
                    System.out.println("✅ Logged out successfully!");
                    return;
                default:
                    System.out.println("❌ Invalid choice. Try again.");
            }
        }
    }

    private void viewSales() {
        System.out.println("📊 Viewing sales data... (Functionality not implemented yet)");
    }

    private void viewStocks() {
        System.out.println("📦 Viewing stocks data... (Functionality not implemented yet)");
    }

}

package myPackage;

import java.util.Scanner;

public class Main {

    public static void main(String[] args) {
        EmployeeService employeeService = new EmployeeService();
        Scanner scanner = new Scanner(System.in);

        while (true) {
            System.out.print("Enter Name: ");
            String name = scanner.nextLine();

            System.out.print("Enter Password: ");
            String password = scanner.nextLine();

            System.out.print("Enter Role: ");
            String role = scanner.nextLine().trim().toLowerCase();

            if (employeeService.login(name, password, role)) {
                // Store session
                SessionManager.setUser(name, role);

                switch (role) {
                    case "admin":
                        System.out.println("Welcome Admin!");
                        showAdminDashboard(scanner);
                        break;
                    case "cashier":
                        System.out.println("Welcome Cashier!");
                        showCashierDashboard(scanner);
                        break;
                    default:
                        System.out.println("Invalid role assigned to this account.");
                        break;
                }
                break; // Exit login loop after success
            } else {
                System.out.println("Invalid Credentials or Role Mismatch.");
                System.out.print("Do you want to try again? (yes/no): ");
                String choice = scanner.nextLine().trim().toLowerCase();

                if (!choice.equals("yes")) {
                    System.out.println("Exiting...");
                    break;
                }
            }
        }

        scanner.close();
    }

    private static void showAdminDashboard(Scanner scanner) {
        while (SessionManager.isLoggedIn()) {
            System.out.println("\n==============================");
            System.out.println("     ADMIN DASHBOARD      ");
            System.out.println("==============================");
            System.out.println("1. View Employees Record");
            System.out.println("2. Add new employee");
            System.out.println("3. Remove employee");
            System.out.println("4. Update employee details");
            System.out.println("5. Log out");
            System.out.println("==============================");
            System.out.print("Enter choice: ");

            int choice = scanner.nextInt();
            scanner.nextLine(); // Consume newline

            switch (choice) {
                case 1:
                    System.out.println("Viewing Employee Records...");
                    break;
                case 2:
                    System.out.println("Adding New Employee...");
                    break;
                case 3:
                    System.out.println("Removing Employee...");
                    break;
                case 4:
                    System.out.println("Updating Employee Details...");
                    break;
                case 5:
                    SessionManager.logout();
                    return; // Exit dashboard
                default:
                    System.out.println("Invalid choice. Try again.");
            }
        }
    }

    private static void showCashierDashboard(Scanner scanner) {
        while (SessionManager.isLoggedIn()) {
            System.out.println("\n==============================");
            System.out.println("     CASHIER DASHBOARD      ");
            System.out.println("==============================");
            System.out.println("1. Process a sale");
            System.out.println("2. View sales history");
            System.out.println("3. Log out");
            System.out.println("==============================");
            System.out.print("Enter choice: ");

            int choice = scanner.nextInt();
            scanner.nextLine(); // Consume newline

            switch (choice) {
                case 1:
                    System.out.println("Processing Sale...");
                    break;
                case 2:
                    System.out.println("Viewing Sales History...");
                    break;
                case 3:
                    SessionManager.logout();
                    return; // Exit dashboard
                default:
                    System.out.println("Invalid choice. Try again.");
            }
        }
    }
}

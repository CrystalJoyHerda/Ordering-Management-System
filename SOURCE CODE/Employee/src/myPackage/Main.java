package myPackage;

import java.util.Scanner;
import myPackage.AdminDashboard;
import myPackage.EmployeeService;

public class Main {
    public static void main(String[] args) {
        EmployeeService employeeService = new EmployeeService();
        Scanner scanner = new Scanner(System.in);

        while (true) {
            System.out.print("Enter Employee ID: ");
            String name = scanner.nextLine();

            System.out.print("Enter Password: ");
            String password = scanner.nextLine();

            String role = employeeService.login(name, password); // ✅ Get role

            if (role != null) {
                SessionManager.setUser(name, role); // ✅ Store role in session
                System.out.println("Login successful! Welcome, " + name + "!");

                if (role.equalsIgnoreCase("admin")) { // ✅ Only admins can access dashboard
                    AdminDashboard adminDashboard = new AdminDashboard(employeeService);
                    adminDashboard.showDashboard(scanner);
                } else {
                    System.out.println("You do not have admin privileges.");
                }
                break;
            } else {
                System.out.println("❌ Invalid Credentials.");
                System.out.print("Try again? (yes/no): ");
                String choice = scanner.nextLine().trim().toLowerCase();
                if (!choice.equals("yes")) {
                    System.out.println("Exiting...");
                    break;
                }
            }
        }
        scanner.close();
    }
}

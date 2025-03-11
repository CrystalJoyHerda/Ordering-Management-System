package myPackage;

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        EmployeeService employeeService = new EmployeeService();
        ManageEmployees manageEmployees = new ManageEmployees(employeeService); 
        Scanner sc = new Scanner(System.in);

        while (true) {
            System.out.print("Enter username: ");
            String name = sc.nextLine();

            System.out.print("Enter Password: ");
            String password = sc.nextLine();

            String role = employeeService.login(name, password);

            if (role != null) {
                SessionManager.setUser(name, role); 
                System.out.println("Login successful! Welcome, " + name + "!");

                if (role.equalsIgnoreCase("admin")) { 
                    AdminDashboard adminDashboard = new AdminDashboard(manageEmployees);
                    adminDashboard.showDashboard(sc);
                } else {
                    System.out.println("You do not have admin privileges.");
                }
                break;
            } else {
                System.out.println("❌ Invalid Credentials.");
                System.out.print("Try again? (yes/no): ");
                String choice = sc.nextLine().trim().toLowerCase();
                if (!choice.equals("yes")) {
                    System.out.println("Exiting...");
                    break;
                }
            }
        }
        sc.close();
    }
}

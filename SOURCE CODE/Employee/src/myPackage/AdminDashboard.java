package myPackage;

import java.util.Scanner;

public class AdminDashboard {
    private final EmployeeService employeeService;

    public AdminDashboard(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    public void showDashboard(Scanner scanner) {
        while (SessionManager.isLoggedIn()) {
            System.out.println("\n======== ADMIN DASHBOARD ========");
            System.out.println("1. Add Employee");
            System.out.println("2. View Employees");
            System.out.println("3. Remove Employee");
            System.out.println("4. Edit Employee");
            System.out.println("5. Log Out");
            System.out.print("Enter choice: ");

            int choice = scanner.nextInt();
            scanner.nextLine(); // Consume newline

            switch (choice) {
                case 1:
                    addEmployee(scanner);
                    break;
                case 2:
                    employeeService.viewEmployees();
                    break;
                case 3:
                    removeEmployee(scanner);
                    break;
                case 4:
                    editEmployee(scanner);
                    break;
                case 5:
                    SessionManager.logout();
                    System.out.println("Logged out successfully!");
                    return;
                default:
                    System.out.println("Invalid choice. Try again.");
            }
        }
    }

   private void addEmployee(Scanner scanner) {
    System.out.print("Enter Employee ID: ");
    String empId = scanner.nextLine();
    System.out.print("Enter Name: ");
    String name = scanner.nextLine();
    System.out.print("Enter Password: ");
    String password = scanner.nextLine();
    System.out.print("Enter Role (admin/user): ");  // ✅ New role input
    String role = scanner.nextLine().trim().toLowerCase();

    if (!role.equals("admin") && !role.equals("user")) {  
        System.out.println("❌ Invalid role! Please enter 'admin' or 'user'.");
        return;
    }

    if (employeeService.addEmployee(empId, name, password, role)) {
        System.out.println("✅ Employee added successfully with role: " + role);
    } else {
        System.out.println("❌ Failed to add employee.");
    }
}
    private void removeEmployee(Scanner scanner) {
        System.out.print("Enter Employee ID to remove: ");
        String removeId = scanner.nextLine();

        if (employeeService.removeEmployee(removeId)) {
            System.out.println("✅ Employee removed successfully!");
        } else {
            System.out.println("❌ Failed to remove employee. ID may not exist.");
        }
    }

    private void editEmployee(Scanner scanner) {
        System.out.print("Enter Employee ID to edit: ");
        String editId = scanner.nextLine();
        System.out.print("Enter new Name: ");
        String newName = scanner.nextLine();
        System.out.print("Enter new Password: ");
        String newPassword = scanner.nextLine();

        if (employeeService.editEmployee(editId, newName, newPassword)) {
            System.out.println("✅ Employee details updated successfully!");
        } else {
            System.out.println("❌ Failed to update employee details. ID may not exist.");
        }
    }
}

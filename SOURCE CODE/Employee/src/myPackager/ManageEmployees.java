package myPackager;
import java.util.Scanner;

public class ManageEmployees {
    private final EmployeeService employeeService;

    public ManageEmployees(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    public void showManageEmployeesMenu(Scanner scanner) {
        while (true) {
            System.out.println("\n======== MANAGE EMPLOYEES ========");
            System.out.println("1. Add Employee");
            System.out.println("2. View Employees");
            System.out.println("3. Edit Employee");
            System.out.println("4. Remove Employee");
            System.out.println("5. Back to Dashboard");
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
                    editEmployee(scanner);
                    break;
                case 4:
                    removeEmployee(scanner);
                    break;
                case 5:
                    return;
                default:
                    System.out.println(" Invalid choice. Try again.");
            }
        }
    }

    private void addEmployee(Scanner scanner) {
        System.out.print("Enter Employee ID: ");
        String empId = scanner.nextLine();
        System.out.print("Enter Name: ");
        String name = scanner.nextLine();
        System.out.print("Enter Email: ");
        String email = scanner.nextLine();
        System.out.print("Enter Password: ");
        String password = scanner.nextLine();
        System.out.print("Enter Role (admin/cashier): ");
        String role = scanner.nextLine().trim().toLowerCase();

        if (!role.equals("admin") && !role.equals("cashier")) {
            System.out.println(" Invalid role! Please enter 'admin' or 'cashier'.");
            return;
        }

        if (employeeService.addEmployee(empId, name, email, password, role)) {
            System.out.println(" Employee added successfully with role: " + role);
        } else {
            System.out.println(" Failed to add employee.");
        }
    }

    private void editEmployee(Scanner scanner) {
        System.out.print("Enter Employee ID to edit: ");
        String editId = scanner.nextLine();
        System.out.print("Enter new Name: ");
        String newName = scanner.nextLine();
        System.out.print("Enter new Email: ");
        String newEmail = scanner.nextLine();
        System.out.print("Enter new Password: ");
        String newPassword = scanner.nextLine();
        System.out.print("Enter new Role (admin/cashier): ");
        String newRole = scanner.nextLine().trim().toLowerCase();

        if (!newRole.equals("admin") && !newRole.equals("cashier")) {
            System.out.println(" Invalid role! Please enter 'admin' or 'cashier'.");
            return;
        }

        if (employeeService.editEmployee(editId, newName, newEmail, newPassword, newRole)) {
            System.out.println(" Employee details updated successfully!");
        } else {
            System.out.println(" Failed to update employee details. ID may not exist.");
        }
    }

    private void removeEmployee(Scanner scanner) {
        System.out.print("Enter Employee ID to remove: ");
        String removeId = scanner.nextLine();

        if (employeeService.removeEmployee(removeId)) {
            System.out.println(" Employee removed successfully!");
        } else {
            System.out.println(" Failed to remove employee. ID may not exist.");
        }
    }

}

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
              

                // Validate if the role matches the user's credentials
                switch (role) {
                    case "admin":
                        System.out.println("Welcome Admin!");
                        showAdminDashboard();
                        break;
                    case "cashier":
                        System.out.println("Welcome Cashier!");
                        showCashierDashboard();
                        
                        break;
                    default:
                        System.out.println("Invalid role assigned to this account.");
                        break;
                }
                break; // Exit loop after successful login
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
      private static void showAdminDashboard() {
        System.out.println("\n==============================");
        System.out.println("     ADMIN DASHBOARD      ");
        System.out.println("==============================");
        System.out.println("1.view Employees Record");
        System.out.println("2.Add new employee");
        System.out.println("3.Remove employee");
        System.out.println("4.Update employee details");
        System.out.println("5.Log out");
        System.out.println("==============================");
}
       private static void showCashierDashboard() {
        System.out.println("\n==============================");
        System.out.println("     CASHIER DASHBOARD      ");
        System.out.println("==============================");
        System.out.println("1.Process a sale");
        System.out.println("2.View sales history");
        System.out.println("3.Log out");
        
}
}
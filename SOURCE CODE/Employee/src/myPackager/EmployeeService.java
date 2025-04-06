package myPackager;

import java.sql.*;

public class EmployeeService {

    // Login method to verify user credentials and return the role
    public String login(String username, String password) {
        String query = "SELECT role, password_hash FROM employees WHERE name = ?";
        try (Connection conn = EmployeeDB.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, username);
            System.out.println("Executing query: " + query + " with username: " + username);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                String dbPasswordHash = rs.getString("password_hash");
                System.out.println("Retrieved password hash: " + dbPasswordHash);
                System.out.println("Hashed password: " + PasswordUtil.hashPassword(password));

                if (dbPasswordHash.equals(PasswordUtil.hashPassword(password))) {
                    return rs.getString("role");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // Adds a new employee to the database
    public boolean addEmployee(String empId, String name, String email, String password, String role) {
        String query = "INSERT INTO employees (emp_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = EmployeeDB.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, empId);
            stmt.setString(2, name);
            stmt.setString(3, email);
            stmt.setString(4, PasswordUtil.hashPassword(password));
            stmt.setString(5, role);

            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // Displays all employees
    public void viewEmployees() {
        String query = "SELECT emp_id, name, email, role FROM employees";

        try (Connection conn = EmployeeDB.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query);
             ResultSet rs = stmt.executeQuery()) {

            System.out.println("\n========= EMPLOYEES LIST =========");
            System.out.printf("%-10s | %-15s | %-25s | %-10s%n", "ID", "Name", "Email", "Role");
            System.out.println("------------------------------------------------------------");

            while (rs.next()) {
                System.out.printf("%-10s | %-15s | %-25s | %-10s%n",
                        rs.getString("emp_id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("role"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // Removes an employee by empId
    public boolean removeEmployee(String empId) {
        String query = "DELETE FROM employees WHERE emp_id = ?";

        try (Connection conn = EmployeeDB.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, empId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // Edits employee information
    public boolean editEmployee(String empId, String newName, String newEmail, String newPassword, String newRole) {
        String query = "UPDATE employees SET name = ?, email = ?, password_hash = ?, role = ? WHERE emp_id = ?";

        try (Connection conn = EmployeeDB.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, newName);
            stmt.setString(2, newEmail);
            stmt.setString(3, PasswordUtil.hashPassword(newPassword));
            stmt.setString(4, newRole);
            stmt.setString(5, empId);

            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}

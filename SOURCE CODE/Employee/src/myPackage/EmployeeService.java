package myPackage;

import java.sql.*;

public class EmployeeService {
    
    public String login(String name, String password) {
    String query = "SELECT role, password_hash FROM employees WHERE name = ?";

    try (Connection conn = EmployeeDB.getConnection();
         PreparedStatement stmt = conn.prepareStatement(query)) {
        stmt.setString(1, name);
        ResultSet rs = stmt.executeQuery();

        if (rs.next()) {
            String storedHash = rs.getString("password_hash");
            if (storedHash.equals(PasswordUtil.hashPassword(password))) { 
                return rs.getString("role"); // ✅ Return role if login successful
            }
        }
    } catch (SQLException e) {
        e.printStackTrace();
    }
    return null;
}

    public boolean addEmployee(String empId, String name, String password, String role) {
    String query = "INSERT INTO employees (emp_id, name, password_hash, role) VALUES (?, ?, ?, ?)";

    try (Connection conn = EmployeeDB.getConnection();
         PreparedStatement stmt = conn.prepareStatement(query)) {
        stmt.setString(1, empId);
        stmt.setString(2, name);
        stmt.setString(3, PasswordUtil.hashPassword(password));
        stmt.setString(4, role);  // ✅ Store role in DB
       
        return stmt.executeUpdate() > 0; 
    } catch (SQLException e) {
        e.printStackTrace();
        return false;
    }
}

    public void viewEmployees() {
        String query = "SELECT emp_id, name FROM employees"; // ✅ Removed `role`
        
        try (Connection conn = EmployeeDB.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query);
             ResultSet rs = stmt.executeQuery()) {
            
            System.out.println("\nEmployees List:");
            while (rs.next()) {
                System.out.println("ID: " + rs.getString("emp_id") +
                                   " | Name: " + rs.getString("name"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public boolean removeEmployee(String name) {
        String query = "DELETE FROM employees WHERE emp_id = ?";

        try (Connection conn = EmployeeDB.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            stmt.setString(1, name);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean editEmployee(String empId, String newName, String newPassword) {
        String query = "UPDATE employees SET name = ?, password_hash = ? WHERE emp_id = ?";

        try (Connection conn = EmployeeDB.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            stmt.setString(1, newName);
            stmt.setString(2, PasswordUtil.hashPassword(newPassword));
            stmt.setString(3, empId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}

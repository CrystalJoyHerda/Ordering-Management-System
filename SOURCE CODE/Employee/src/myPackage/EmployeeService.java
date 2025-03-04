package myPackage;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class EmployeeService {

    public boolean login(String name, String password, String role) {
        String query = "SELECT * FROM employees WHERE name = ? AND password_hash = ? AND role = ?";
        
        try (Connection conn = EmployeeDB.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, name);
            stmt.setString(2, hashPassword(password)); // Hash the input password before checking
            stmt.setString(3, role);

            ResultSet rs = stmt.executeQuery();
            return rs.next(); // If a record exists, login is successful
            
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // Method to hash passwords using SHA-256
    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            StringBuilder hexString = new StringBuilder();

            for (byte b : hash) {
                hexString.append(String.format("%02x", b)); // Convert bytes to hex
            }

            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error: Unable to hash password", e);
        }
    }
}

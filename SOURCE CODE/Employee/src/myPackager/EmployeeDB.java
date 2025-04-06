package myPackager;

import java.sql.*;


public class EmployeeDB {
    private static final String URL = "jdbc:mysql://localhost:3306/employee_db";
    private static final String USER = "emp";
    private static final String PASSWORD = "emp";

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("✅ MySQL JDBC Driver loaded successfully.");
        } catch (ClassNotFoundException e) {
            System.out.println("❌ Failed to load MySQL JDBC Driver.");
            e.printStackTrace();
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

}

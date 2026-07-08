package com.alisonrasnic.myInventoryBackend;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Nullable;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.lang.ProcessBuilder.Redirect;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.*;
import java.util.HexFormat;
import java.util.Properties;

@SpringBootApplication
@RestController
public class MyInventoryBackendApplication {
  static String url = "jdbc:postgresql://localhost/myInventoryDb";
  static Properties props;
  static Connection conn;

  public static void main(String[] args) throws SQLException {
    props = new Properties();
    props.setProperty("user", "myinventoryadmin");
    props.setProperty("password", "0000");

    conn = DriverManager.getConnection(url, props);

    SpringApplication.run(MyInventoryBackendApplication.class, args);
  }
  
  private static Person getDb(String table, String clause) throws SQLException {
    Statement st = conn.createStatement();
    String cmd = String.format("SELECT * FROM %s %s;", table, clause);
    System.out.println(cmd);
    ResultSet rs = st.executeQuery(cmd);

    Person person = new Person(0, "null", "null", null, null);
    if (rs.next()) {
      person = new Person(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getBytes(5));
    }
    
    return person;
  }

  private static void insertDb(String table, String params, String values) throws SQLException {
    Statement st = conn.createStatement();
    String cmd = String.format("INSERT INTO %s %s VALUES (%s);", table, params, values);
    System.out.println(cmd);

    st.execute(cmd);
  }

  private static byte[] makeSalt() {
    SecureRandom r = new SecureRandom();
    byte[] salt = new byte[64];
    r.nextBytes(salt);
    return salt;
  }

  private static String makeHash(String pw, byte[] salt) throws IOException {
    ProcessBuilder ag2 = new ProcessBuilder("argon2", HexFormat.of().formatHex(salt), "-e");
    ag2.redirectOutput(Redirect.PIPE);
    Process p = ag2.start();
    try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(p.getOutputStream()))) {
      writer.write(pw);
      writer.flush();
    } 
    byte[] b = new byte[256];
    int cur = p.getInputStream().read();
    int i = 0;
    while (cur != -1) {
      if ((byte)cur != '\n' && (char)cur != '\u0000')
        b[i++] = (byte)cur;
      cur = p.getInputStream().read();
    }

    String s = new String(b);
    s = s.replace("\u0000", "").trim();
    return s;
  }

  private static String getUserHash(String userName) throws SQLException {
    return getDb("person", String.format("WHERE name = \'%s\'", userName)).password();
  }

  private static byte[] getUserSalt(String userName) throws SQLException {
    return getDb("person", String.format("WHERE name = \'%s\'", userName)).salt();
  }
  
  @GetMapping("/getUser")
  public Person getUser(@RequestParam(value = "userName", defaultValue = "user") String userName) throws SQLException {
    Person p = getDb("person", String.format("WHERE name = \'%s\'", userName));
    return p;
  }

  @GetMapping("/createUser")
  public ResponseEntity createUser(@RequestBody PersonForm personForm) throws SQLException, IOException {
    byte[] salt = makeSalt();
    String b = makeHash(personForm.pw, salt);

    String values = String.format("\'%s\', \'%s\', \'%s\', \'\\xx%s\'", personForm.name, personForm.email, b, HexFormat.of().formatHex(salt));
  
    String sql = "INSERT INTO Person (name, email, pw, salt) VALUES (?, ?, ?, ?);";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    pstmt.setString(1, personForm.name);
    pstmt.setString(2, personForm.email);
    pstmt.setString(3, b);
    pstmt.setBytes(4, salt);
    pstmt.executeUpdate();

    Person pe = getDb("person", String.format("WHERE name = \'%s\'", personForm.name));
    String authValues = String.format("\'%d\', false, false", pe.id());
    insertDb("auth", "(userid, admin, moderator)", authValues);
    return ResponseEntity.ok(HttpStatus.OK);
  }

  @GetMapping("/login")
  public ResponseEntity loginUser(@RequestBody LoginForm login) throws SQLException, IOException {
    var user_hash = getUserHash(login.username);
    var check_hash = makeHash(login.password, getUserSalt(login.username));
    var valid = MessageDigest.isEqual(user_hash.trim().getBytes(), check_hash.trim().getBytes());
    return ResponseEntity.ok(valid);
  }
}


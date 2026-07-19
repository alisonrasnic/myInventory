package com.alisonrasnic.myInventoryBackend;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseEntity.BodyBuilder;
import org.springframework.http.support.HttpComponentsHeadersAdapter;
import org.springframework.http.support.JettyHeadersAdapter;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.lang.ProcessBuilder.Redirect;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.*;
import java.time.LocalDateTime;
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
  public ResponseEntity<HttpStatus> createUser(@RequestBody PersonForm personForm) throws SQLException, IOException {
    byte[] salt = makeSalt();
    String b = makeHash(personForm.pw, salt);

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
  public ResponseEntity<Boolean> loginUser(@RequestBody LoginForm login) throws SQLException, IOException {
    var user_hash = getUserHash(login.username);
    var check_hash = makeHash(login.password, getUserSalt(login.username));
    var valid = MessageDigest.isEqual(user_hash.trim().getBytes(), check_hash.trim().getBytes());
    return ResponseEntity.ok(valid);
  }

  @DeleteMapping("/remove_item")
  public ResponseEntity<HttpStatus> removeItem(@RequestBody Integer id) throws SQLException, IOException {
    // TODO: Verify user 
    String sql = "DELETE FROM ItemToRecord WHERE item_id = ?;";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    pstmt.setInt(1, id);
    System.out.println(pstmt);
    pstmt.executeUpdate();

    sql = "DELETE FROM Item WHERE id = ?;";
    pstmt = conn.prepareStatement(sql);
    pstmt.setInt(1, id);
    System.out.println(pstmt);
    pstmt.executeUpdate();

    return ResponseEntity.ok(HttpStatus.OK);
  }

  @PostMapping("/add_item")
  public ResponseEntity<Integer> addItem(@RequestBody ItemForm item) throws SQLException, IOException {
    // TODO: Add user check
    String sql = "INSERT INTO item (name, description, added, use_by, expires_by) VALUES (?, ?, NOW(), ?, ?);";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    pstmt.setString(1, item.name());
    pstmt.setString(2, item.description());
    pstmt.setTimestamp(3, Timestamp.valueOf(item.useBy()));
    pstmt.setTimestamp(4, Timestamp.valueOf(item.expiresBy()));
    System.out.println(pstmt);
    pstmt.executeUpdate();

    Statement st = conn.createStatement();
    String cmd = String.format("SELECT * FROM item WHERE name = \'%s\' and description = \'%s\' and use_by = (\'%s\') and expires_by = (\'%s\');", item.name(), item.description(), Timestamp.valueOf(item.useBy()).toString(), Timestamp.valueOf(item.expiresBy()).toString());
    System.out.println(cmd);
    ResultSet rs = st.executeQuery(cmd);

    int i = -1;
    if (rs.next()) {
      i = rs.getInt(1);
    }

    if (i == -1) {
      throw new SQLException("Could not find ID of inserted item");
    }
    sql = "INSERT INTO itemtorecord (item_id, record_id) VALUES (?, ?);";
    pstmt = conn.prepareStatement(sql);
    pstmt.setInt(1, i);
    pstmt.setInt(2, item.recordID());
    System.out.println(pstmt);
    pstmt.executeUpdate();

    return ResponseEntity.ok().body(i);
  }

  @PostMapping("/create_record")
  public ResponseEntity<Integer> createRecord(@RequestBody RecordForm rec) throws SQLException, IOException {
    // TODO: Add user check
    String sql = "INSERT INTO record (name, created) VALUES (?, NOW());";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    pstmt.setString(1, rec.name());
    pstmt.executeUpdate();

    // TODO: Grab id from db
    int id = 1;

    return ResponseEntity.ok().body(id);
  }

  @PostMapping("/get_items")
  public ResponseEntity<Item[]> getItems(@RequestBody RecordForm rec) throws SQLException, IOException {
    Statement st = conn.createStatement();
    String cmd = String.format("SELECT id FROM record WHERE name = \'%s\';", rec.name());
    ResultSet rs = st.executeQuery(cmd);
    int id = -1;

    if (rs.next()) {
      id = rs.getInt(1);
    }
    if (id == -1) throw new SQLException("Could not find record with name %s", rec.name());

    Item[] items = new Item[255];
    st = conn.createStatement();
    cmd = String.format("SELECT i.id, i.name, i.description, i.added, i.use_by, i.expires_by FROM item i JOIN itemtorecord ir ON i.id = ir.item_id WHERE ir.record_id = %d;", id);
    System.out.println(cmd);
    rs = st.executeQuery(cmd);

    int i = 0;
    while (rs.next()) {
      Timestamp added = rs.getTimestamp(4);
      Timestamp useBy = rs.getTimestamp(5);
      Timestamp expiresBy = rs.getTimestamp(6);
      Item item = new Item(
        rs.getLong(1),
        rs.getString(2),
        rs.getString(3),
        LocalDateTime.of(1900+added.getYear(), added.getMonth()+1, added.getDay()+1, added.getHours(), added.getMinutes(), added.getSeconds()),
        LocalDateTime.of(1900+useBy.getYear(), useBy.getMonth()+1, useBy.getDay()+1, useBy.getHours(), useBy.getMinutes(), useBy.getSeconds()),
        LocalDateTime.of(1900+expiresBy.getYear(), expiresBy.getMonth()+1, expiresBy.getDay()+1, expiresBy.getHours(), expiresBy.getMinutes(), expiresBy.getSeconds())
      );
      items[i] = item;
      i += 1;
    }

    return ResponseEntity.ok().body(items);
  }
}


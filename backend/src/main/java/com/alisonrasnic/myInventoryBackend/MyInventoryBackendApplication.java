package com.alisonrasnic.myInventoryBackend;
import org.apache.tomcat.util.json.JSONParser;
import org.jspecify.annotations.Nullable;
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
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Properties;

@SpringBootApplication
@RestController
public class MyInventoryBackendApplication {
  static String url = "jdbc:postgresql://localhost/myInventoryDb";
  static Properties props;
  static Connection conn;

  record CreatePersonReq(String username, String email, String pw){}
  record LoginReq(String email, String pw){}
  record UserAuth(String jwt, Integer userId){}

  record DeleteItemReq(Integer id, UserAuth auth){}
  record AddItemReq(String name, String description, LocalDateTime useBy, LocalDateTime expiresBy, Integer recordID, UserAuth auth){}
  record DeleteRecordReq(Integer id, UserAuth auth){}
  record GetRecordReq(Integer id, UserAuth auth){}
  record AddRecordReq(String name, String description, UserAuth auth){}
  record GetRecordsReq(UserAuth auth){}

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

  private static String getUserHash(String email) throws SQLException {
    return getDb("person", String.format("WHERE email = \'%s\'", email)).password();
  }

  private static byte[] getUserSalt(String email) throws SQLException {
    return getDb("person", String.format("WHERE email = \'%s\'", email)).salt();
  }

  private static long getUserID(String email) throws SQLException {
    return getDb("person", String.format("WHERE email = \'%s\'", email)).id();
  }
  
  @GetMapping("/get_user")
  public Person getUser(@RequestParam(value = "email", defaultValue = "email@email.com") String email) throws SQLException {
    Person p = getDb("person", String.format("WHERE email = \'%s\'", email));
    return p;
  }

  @GetMapping("/create_user")
  public ResponseEntity<String> createUser(@RequestBody CreatePersonReq req) throws SQLException, IOException {
    byte[] salt = makeSalt();
    String b = makeHash(req.pw, salt);

    String sql = "INSERT INTO Person (name, email, pw, salt) VALUES (?, ?, ?, ?);";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    pstmt.setString(1, req.username);
    pstmt.setString(2, req.email);
    pstmt.setString(3, b);
    pstmt.setBytes(4, salt);
    pstmt.executeUpdate();

    Person pe = getDb("person", String.format("WHERE email = \'%s\'", req.email));
    String authValues = String.format("\'%d\', false, false", pe.id());
    insertDb("auth", "(userid, admin, moderator)", authValues);
    return loginUser(new LoginReq(req.email, req.pw));
  }

  @PostMapping("/login")
  public ResponseEntity<String> loginUser(@RequestBody LoginReq req) throws SQLException, IOException {
    var user_hash = getUserHash(req.email);
    var check_hash = makeHash(req.pw, getUserSalt(req.email));
    var valid = MessageDigest.isEqual(user_hash.trim().getBytes(), check_hash.trim().getBytes());
    long id = getUserID(req.email);
    if (valid) {
      JWTHandler gen = new JWTHandler();
      return ResponseEntity.ok(gen.nextToken(id, req.email));
    }

    return ResponseEntity.ok("false");
  }

  protected boolean verifyHeaderString(String headerString) {
    Character c = '\u0000';
    int i = -1;
    while (i < headerString.length()) {
      StringBuilder key = new StringBuilder();
      StringBuilder value = new StringBuilder();
      while (c != '\"') {
        i++;
        c = headerString.charAt(i);
      }
      i++;
      c = headerString.charAt(i);
      key.append(c);

      while (c != '\"') {
        i++;
        c = headerString.charAt(i);
        if (c != '\"')
          key.append(c);
      }
      i++;
      c = headerString.charAt(i);

      while (c != '\"') {
        i++;
        c = headerString.charAt(i);
      }
      i++;
      c = headerString.charAt(i);
      value.append(c);

      while (c != '\"') {
        i++;
        c = headerString.charAt(i);
        if (c != '\"')
          value.append(c);
      }
      i++;
      c = headerString.charAt(i);

      if (key.toString() == "typ") {
        if (value.toString() != "JWT") return false;
      } else if (key.toString() == "alg") {
        if (value.toString() != "HS512") return false;
      }

      i++;
      if (i >= headerString.length()) break;
      c = headerString.charAt(i);
    }

    return true;
  }

  protected boolean verifyPayloadString(String payloadString, Integer id) {
    Character c = '\u0000';
    int i = -1;
    while (i < payloadString.length()) {
      StringBuilder key = new StringBuilder();
      StringBuilder value = new StringBuilder();
      while (c != '\"') {
        i++;
        c = payloadString.charAt(i);
      }
      i++;
      c = payloadString.charAt(i);
      key.append(c);

      while (c != '\"') {
        i++;
        c = payloadString.charAt(i);
        if (c != '\"')
          key.append(c);
      }
      i++;
      c = payloadString.charAt(i);

      while (c != '\"') {
        i++;
        c = payloadString.charAt(i);
      }
      i++;
      c = payloadString.charAt(i);
      value.append(c);

      while (c != '\"') {
        i++;
        c = payloadString.charAt(i);
        if (c != '\"')
          value.append(c);
      }
      i++;
      c = payloadString.charAt(i);

      if (key.toString().equals("sub")) {
        if (value.toString().equals(id.toString())) return true;
      }

      i++;
      if (i >= payloadString.length()) break;
      c = payloadString.charAt(i);
    }

    return false;
  }

  protected boolean verifyUser(UserAuth auth) {
    JWTHandler handler = new JWTHandler();
    boolean validToken = handler.verifyToken(auth.jwt());
    if (!validToken) return false;

    byte[] header = Base64.getUrlDecoder().decode(handler.getHeader(auth.jwt()));
    byte[] payload = Base64.getUrlDecoder().decode(handler.getPayload(auth.jwt()));
    String headerString = new String(header);
    String payloadString = new String(payload);

    if (!verifyHeaderString(headerString)) { 
      return false;
    }
    if (!verifyPayloadString(payloadString, auth.userId())) { 
      return false;
    }

    return true;
  }

  @DeleteMapping("/delete_item")
  public ResponseEntity<HttpStatus> removeItem(@RequestBody DeleteItemReq req) throws SQLException, IOException {
    if (!verifyUser(req.auth)) return ResponseEntity.ok(HttpStatus.UNAUTHORIZED);

    String sql = "DELETE FROM ItemToRecord WHERE item_id = ?;";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    pstmt.setInt(1, req.id());
    System.out.println(pstmt);
    pstmt.executeUpdate();

    sql = "DELETE FROM Item WHERE id = ?;";
    pstmt = conn.prepareStatement(sql);
    pstmt.setInt(1, req.id());
    System.out.println(pstmt);
    pstmt.executeUpdate();

    return ResponseEntity.ok(HttpStatus.OK);
  }

  @PostMapping("/add_item")
  public ResponseEntity<Integer> addItem(@RequestBody AddItemReq req) throws SQLException, IOException {
    if (!verifyUser(req.auth)) return ResponseEntity.ok(-1);

    String sql = "INSERT INTO item (name, description, added, use_by, expires_by) VALUES (?, ?, NOW(), ?, ?) RETURNING id;";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    pstmt.setString(1, req.name());
    pstmt.setString(2, req.description());
    pstmt.setTimestamp(3, Timestamp.valueOf(req.useBy()));
    pstmt.setTimestamp(4, Timestamp.valueOf(req.expiresBy()));
    System.out.println(pstmt);
    ResultSet rs = pstmt.executeQuery();
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
    pstmt.setInt(2, req.recordID());
    System.out.println(pstmt);
    pstmt.executeUpdate();

    return ResponseEntity.ok().body(i);
  }

  @PostMapping("/add_record")
  public ResponseEntity<Integer> addRecord(@RequestBody AddRecordReq req) throws SQLException, IOException {
    if (!verifyUser(req.auth)) return ResponseEntity.ok(-1);

    String sql = "INSERT INTO record (name, description, created) VALUES (?, ?, NOW()) RETURNING id;";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    pstmt.setString(1, req.name);
    pstmt.setString(2, req.description);
    ResultSet rs = pstmt.executeQuery();
    int id = -1;
    if (rs.next()) {
      id = (int)rs.getLong("id");
    }

    sql = "INSERT INTO persontorecord(person_id, record_id) VALUES (?, ?);";
    pstmt = conn.prepareStatement(sql);
    pstmt.setInt(1, req.auth.userId);
    pstmt.setInt(2, id);
    System.out.println(pstmt);
    pstmt.executeUpdate();

    return ResponseEntity.ok().body(id);
  }

  @DeleteMapping("/delete_record")
  public ResponseEntity<HttpStatus> deleteRecord(@RequestBody DeleteRecordReq req) throws SQLException, IOException {
    if (!verifyUser(req.auth)) return ResponseEntity.ok(HttpStatus.UNAUTHORIZED);
    // TODO: Verify that the user has permission/ownership over this record

    // TODO: In order to remove a record we need to do several things in order:
    //   1. Delete all itemtorecord entries for that record
    //   2. Delete all exclusive items
    //   3. Delete all persontorecord entries for that record
    //   4. Delete the record itself

    String sql = "DELETE from itemtorecord WHERE record_id = ?";
    PreparedStatement st = conn.prepareStatement(sql);
    System.out.println(st);
    st.setLong(1, req.id);
    try {
      st.executeQuery();
    } catch (SQLException e) {
      System.out.println("[INFO]: " + e);
    }

    sql = "DELETE from item WHERE id NOT IN (SELECT item_id from itemtorecord);";
    st = conn.prepareStatement(sql);
    System.out.println(st);
    try {
      st.executeQuery();
    } catch (SQLException e) {
      System.out.println("[INFO]: " + e);
    }

    sql = "DELETE from persontorecord WHERE record_id = ?;";
    st = conn.prepareStatement(sql);
    System.out.println(st);
    st.setLong(1, req.id);
    try {
      st.executeQuery();
    } catch (SQLException e) {
      System.out.println("[INFO]: " + e);
    }

    sql = "DELETE from record where id = ?;";
    st = conn.prepareStatement(sql);
    System.out.println(st);
    st.setLong(1, req.id);
    try {
      st.executeQuery();
    } catch (SQLException e) {
      System.out.println("[INFO]: " + e);
    }

    return ResponseEntity.ok(HttpStatus.OK);
  }

  @PostMapping("/get_records")
  public ResponseEntity<ArrayList<Record>> getRecords(@RequestBody GetRecordsReq req) throws SQLException, IOException {
    if (!verifyUser(req.auth)) return ResponseEntity.ok(new @Nullable ArrayList<Record>());

    Statement st = conn.createStatement();

    ArrayList<Record> records = new ArrayList<Record>();
    st = conn.createStatement();
    String cmd = String.format("SELECT r.id, r.name, r.description FROM record r JOIN persontorecord pr ON r.id = pr.record_id WHERE pr.person_id = %d;", req.auth.userId);
    System.out.println(cmd);
    ResultSet rs = st.executeQuery(cmd);

    while (rs.next()) {
      Record r = new Record(
        (int)rs.getLong(1),
        rs.getString(2),
        rs.getString(3)
      );
      records.add(r);
    }

    return ResponseEntity.ok().body(records);
  }

  @PostMapping("/get_items")
  public ResponseEntity<Item[]> getItems(@RequestBody GetRecordReq req) throws SQLException, IOException {
    if (!verifyUser(req.auth)) return ResponseEntity.ok(new Item[]{});

    Statement st = conn.createStatement();
    if (req.id() == -1) throw new SQLException("Could not find record with id " + req.id());

    Item[] items = new Item[255];
    st = conn.createStatement();
    String cmd = String.format("SELECT i.id, i.name, i.description, i.added, i.use_by, i.expires_by FROM item i JOIN itemtorecord ir ON i.id = ir.item_id WHERE ir.record_id = %d;", req.id());
    System.out.println(cmd);
    ResultSet rs = st.executeQuery(cmd);

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


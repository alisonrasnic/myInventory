package com.alisonrasnic.myInventoryBackend;

import java.security.InvalidKeyException;
import java.security.Key;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class JWTHandler {
  public JWTHandler() {
  }

  public String nextToken(long id, String email) {
    String secret = System.getenv("myInventorySecret");
    String header = "{\"alg\": \"HS512\", \"typ\": \"JWT\"}";
    String payload = String.format("{\"sub\": \"%s\", \"email\": \"%s\"}", id, email);

    String headerB64 = Base64.getUrlEncoder().encodeToString(header.getBytes());
    String payloadB64 = Base64.getUrlEncoder().encodeToString(payload.getBytes());
    String headerPayload = headerB64 + "." + payloadB64;
    Mac hmac;
    try {
      hmac = Mac.getInstance("HmacSHA512");
      Key secretKey = new SecretKeySpec(secret.getBytes(), "HmacSHA512");
      try {
        hmac.init(secretKey);
      } catch (InvalidKeyException e) {
        e.printStackTrace();
      }
      byte[] signature = hmac.doFinal(headerPayload.getBytes());
      String res = Base64.getUrlEncoder().encodeToString(signature);
      return headerB64 + "." + payloadB64 + "." + res;
    } catch (NoSuchAlgorithmException e) {
      e.printStackTrace();
    }

    return "false";
  }

  private String parseUntilSectionEnd(StringBuilder token) {
    String section = new String();
    int i = 0;
    Character c = token.charAt(i);
    section += token.charAt(0);
    while (i+1 < token.length() && c != '.') {
      i++;
      c = token.charAt(i);
      if (c != '.')
        section += c;
    }

    if (i+1 <= token.length())
      token.delete(0, i+1);
    else
      token.delete(0, token.length());

    return section;
  }

  public String getHeader(String token) {
    StringBuilder tokenBuilder = new StringBuilder(token);
    return parseUntilSectionEnd(tokenBuilder);
  }

  public String getPayload(String token) {
    StringBuilder tokenBuilder = new StringBuilder(token);
    parseUntilSectionEnd(tokenBuilder);
    return parseUntilSectionEnd(tokenBuilder);
  }

  public boolean verifyToken(String token) {
    if (token.equals("")) return false;

    String secret = System.getenv("myInventorySecret");
    StringBuilder tokenBuilder = new StringBuilder(token);
    String headerB64 = parseUntilSectionEnd(tokenBuilder);
    String payloadB64 = parseUntilSectionEnd(tokenBuilder);
    String signatureB64 = parseUntilSectionEnd(tokenBuilder);

    byte[] signature = Base64.getUrlDecoder().decode(signatureB64);

    Mac hmac;
    try {
      hmac = Mac.getInstance("HmacSHA512");
      Key secretKey = new SecretKeySpec(secret.getBytes(), "HmacSHA512");
      try {
        hmac.init(secretKey);
        byte[] newSig = (headerB64 + "." + payloadB64).getBytes();
        byte[] originalSig = hmac.doFinal(newSig);
        return MessageDigest.isEqual(originalSig, signature);
      } catch (InvalidKeyException e) {
        e.printStackTrace();
      }
    } catch (NoSuchAlgorithmException e) {
      e.printStackTrace();
    }

    return false;
  }
}

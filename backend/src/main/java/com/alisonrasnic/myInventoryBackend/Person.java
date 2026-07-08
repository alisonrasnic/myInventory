package com.alisonrasnic.myInventoryBackend;

public record Person (long id, String name, String email, String password, byte[] salt) {}

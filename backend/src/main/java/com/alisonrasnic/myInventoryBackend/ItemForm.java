package com.alisonrasnic.myInventoryBackend;

import java.time.LocalDateTime;

public record ItemForm(String name, String description, LocalDateTime useBy, LocalDateTime expiresBy, int recordID) {}

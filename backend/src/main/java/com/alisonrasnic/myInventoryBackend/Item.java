package com.alisonrasnic.myInventoryBackend;

import java.time.LocalDateTime;

public record Item(long id, String name, String description, LocalDateTime added, LocalDateTime useBy, LocalDateTime expiresBy) {}

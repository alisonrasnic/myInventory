package com.alisonrasnic.myInventoryBackend.inventory;

import com.alisonrasnic.myInventoryBackend.inventory.Item;
import jakarta.annotation.Nullable;

import java.io.*;
import java.util.Vector;

public class Inventory {
  String name;
  @Nullable String description;
  @Nullable String[] tags;
  Vector<Item> items;

  public Inventory(Iterable<Item> items, String name) {
    this.name = name;
    for (var i : items) {
      this.items.add(i);
    }
  }

  public Item getItem(int i) {
    return items.get(i);
  }

  public void setItem(int i, Item item) {
    items.set(i, item);
  }

  public boolean save(@Nullable String path) {
    if (path == null) {

    } else {
      try {
        FileWriter w = new FileWriter(path);
        for (Item i : this.items) {
          w.write(i.save());
        }
      } catch (IOException e) {
        throw new RuntimeException(e);
      }
    }

    return true;
  }
}

package com.alisonrasnic.myInventoryBackend.inventory;

import java.sql.Time;

public class Item {
  String name;
  String description;
  Time enter;
  Time bestBy;
  Time expires;
  String[] tags;

  public String save() {return "poopy";}
}

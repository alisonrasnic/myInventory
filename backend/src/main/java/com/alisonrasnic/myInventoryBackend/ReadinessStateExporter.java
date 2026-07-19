package com.alisonrasnic.myInventoryBackend;

import java.io.File;
import java.io.IOException;

import org.springframework.boot.availability.AvailabilityChangeEvent;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ReadinessStateExporter {
  static String healthyPath = "tmp/healthy";

  @EventListener
  public void onStateChange(AvailabilityChangeEvent<ReadinessState> event) {
    switch (event.getState()) {
      case ACCEPTING_TRAFFIC -> {
        try {
          File t = new File(healthyPath);
          if (t.createNewFile()) {
            System.out.println("INFO: Server is healthy");
          }
        } catch (IOException e) {
          System.err.print("ERROR: ");
          e.printStackTrace();
        }
      }
      case REFUSING_TRAFFIC -> {
        File t = new File(healthyPath);
        if (t.delete()) {
          System.out.println("INFO: Server is not healthy");
        }
      }
    }
  }
}

package com.photobooth.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://127.0.0.1:5500")
public class PhotoController {

    // Folder where photos will be stored
    private static final String PHOTO_DIR =
            "src/main/resources/static/photos/";

    // ==============================
    // 1️⃣ Upload Photo API
    // ==============================
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<String> uploadPhoto(
            @RequestParam("photo") MultipartFile photo) throws IOException {

        if (photo.isEmpty()) {
            return ResponseEntity.badRequest().body("Photo is empty");
        }

        File folder = new File(PHOTO_DIR);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String fileName = System.currentTimeMillis() + ".png";
        File file = new File(folder, fileName);

        photo.transferTo(file);

        System.out.println("Photo saved: " + file.getAbsolutePath());

        return ResponseEntity.ok("Photo saved successfully");
    }

    // ==============================
    // 2️⃣ List Photos API (Gallery)
    // ==============================
    @GetMapping("/photos")
    public List<String> listPhotos() {

        File folder = new File(PHOTO_DIR);
        List<String> photos = new ArrayList<>();

        if (folder.exists()) {
            File[] files = folder.listFiles();
            if (files != null) {
                for (File file : files) {
                    photos.add(file.getName());
                }
            }
        }

        return photos;
    }
}

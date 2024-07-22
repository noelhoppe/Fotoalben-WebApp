CREATE DATABASE MediaVaultDB;

USE MediaVaultDB;

CREATE TABLE Users(
    ID INTEGER AUTO_INCREMENT PRIMARY KEY ,
    username VARCHAR(30) UNIQUE NOT NULL,
    password VARCHAR(60) NOT NULL, -- Durch bycrypt gehaste Passwörter haben 60 Zeichen
    role ENUM('ADMIN', 'USER') DEFAULT 'USER'
);

INSERT INTO Users
VALUES (1, 'admin', '$2a$10$DqSHWaxlejgJ6RdPxRu8Iuv7NQmjK9/8ybJJ/H3lRnWRZv9r95rY6', 'ADMIN'); -- durch bycrypt gehastes Passwort mit Round 10; password für admin ist root

CREATE TABLE Photos(
    ID INTEGER AUTO_INCREMENT PRIMARY KEY,
    Users_ID INTEGER,
    FOREIGN KEY (Users_ID) REFERENCES Users(ID),
    title VARCHAR(30) NOT NULL,
    taken DATE NOT NULL,
    url VARCHAR(30) UNIQUE NOT NULL
);

Create TABLE Albums(
    ID INTEGER AUTO_INCREMENT PRIMARY KEY,
    Users_ID INTEGER,
    FOREIGN KEY (Users_ID) REFERENCES Users(ID),
    title VARCHAR(30) NOT NULL
);

CREATE TABLE AlbumsPhotos(
  Photos_ID INTEGER,
  Albums_ID INTEGER,
  PRIMARY KEY (Photos_ID, Albums_ID),
  FOREIGN KEY (Photos_ID) REFERENCES Photos(ID),
  FOREIGN KEY (Albums_ID) REFERENCES Albums(ID)
);


CREATE TABLE Tags(
    ID INTEGER AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE PhotosTags(
    Photos_ID INTEGER,
    TAGS_ID INTEGER,
    PRIMARY KEY (Photos_ID, TAGS_ID),
    FOREIGN KEY (Photos_ID) REFERENCES Photos(ID),
    FOREIGN KEY (TAGS_ID) REFERENCES Tags(ID)
);


CREATE TABLE AlbumsTags(
    Alben_ID INTEGER,
    Tags_ID INTEGER,
    PRIMARY KEY (Alben_ID, Tags_ID),
    FOREIGN KEY (Alben_ID) REFERENCES Albums(ID),
    FOREIGN KEY (Tags_ID) REFERENCES Tags(ID)
);
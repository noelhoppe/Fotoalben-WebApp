# Informationen zur Inbetriebnahme der Anwendung

---

# DDL Skript für die Initialisierung der Datenbank (u.a. anlegen eines Admin-Nutzer)

---



# ERM Diagramm inklusive kurzer Beschreibung

---

## Tabelle: Users

| Schlüssel | Feldbeschreibung                             |
|-----------|----------------------------------------------|
| PK        | ID INTEGER AUTO_INCREMENT                    |
|           | username VARCHAR(30) UNIQUE NOT NULL         |
|           | password (DATENTYP???) NOT NULL              |
|           | role ENUM('ADMIN', 'USER') DEFAULT 'USER'    |

Ein User hat (0, *) Photos.  
Ein Photo gehört (1, 1) Benutzer.

## Tabelle: Photos

| Schlüssel | Feldbeschreibung                |
|-----------|---------------------------------|
| PK        | ID INTEGER AUTO_INCREMENT       |
| FK        | Users_ID                        |
|           | title VARCHAR(30) NOT NULL      |
|           | taken DATE NOT NULL             |
|           | url VARCHAR(30) UNIQUE NOT NULL |


Ein Photo ist in (0, *) Alben.  
Ein Album enthält (0, *) Photos.

Ein Photo besitzt (0, *) Tags.  
Ein Tag gehört zu (1, *) Photos

## Tabelle: Albums
| Schlüssel  | Feldbeschreibung            |
|------------|-----------------------------|
| PK         | ID INTEGER AUTO_INCREMENT   |
|            | title VARCHAR(30) NOT NULL  |
| FK         | Users_ID                    | 

Ein Album besitzt (0, *) Tags.  
Ein Tag gehört zu (1, *) Album.

## Tabelle: Tags
| Schlüssel | Feldbeschreibung          |
|-----------|---------------------------|
| PK        | ID INTEGER AUTO_INCREMENT |
|           | name VARCHAR(30) NOT NULL | 

## Verbindungstabelle PhotosTags
| Schlüssel | Feldbeschreibung                              |
|-----------|-----------------------------------------------|
| PK        | Photos_ID INTEGER AUTO_INCREMENT              | 
| PK        | Tags_ID INTEGER AUTO_INCREMENT                |
|           | PRIMARY KEY (Photos_ID, TAGS_ID)              |
|           | FOREIGN KEY (Photos_ID) REFERENCES Photos(ID) |
|           | PRIMARY KEY (Tags_ID) REFERENCES Tags(ID)     |


## Verbindungstabelle AlbumsTags
| Schlüssel | Feldbeschreibung                             |
|-----------|----------------------------------------------|
| PK        | Alben_ID INTEGER AUTO_INCREMENT              | 
| PK        | Tags_ID INTEGER AUTO_INCREMENT               |
|           | PRIMARY KEY (ALBEN_ID, TAGS_ID)              |
|           | FOREIGN KEY (ALBEN_ID) REFERENCES Albums(ID) |
|           | PRIMARY KEY (Tags_ID) REFERENCES Tags(ID)    |



# Beschreibung der RESTful-API

---

**TODO:**
- patch routen
- album erstellen: kann direkt ein Bild übergeben werden
- Passwort in response???
- Routen um Bilder mit album zu verbinden/zu trennen?
- wenn nutzer bild nicht gehört 404 oder 403?
- bei patch nochmal alle Infos übertragen? sollte man lieber put verwenden?
- id bei foto zurückgeben (einziger unique parameter), ganauso bei album
- Wie möchten wir die Fotos in der Datenbank speichern (URL oder BLOB)? 
- Wie übertragen wird das Passwort mit JSON bei der Anfrage des Clients
   und bei der Antwort des Servers bzw. übertragen wir es bei der Antwort des Servers überhaupt?
- Welche Länge haben Passwörter, die gehaht gespeichert werden
- Beschreibung des ERM Diagramm in Ordnung? Unterschied zur Beschreibung des DDL Scripts?

---

## Basis-URL
Die Basis-URL für alle Endpunkte lautet: `http://localhost:8080`


## Beschreibung der Endpunkte

### Login & Logout

---

> Endpunkt: POST /login  
> Ein Nutzer meldet sich mit seinem Nutzernamen und Passwort an.

Statuscode (erfolgreich) : **201 (Created)**

JSON-Anfrage:
```JSON
{
  "user" : {
    "username" : "noelhoppe",
    "password" : "___"
  }
}
```

JSON-Antwort:
```JSON
{
  "message" : "Login erfolgreich.",
  "sessionID" : "a1b2c3d4e5f6g7h8i9j0",
  "user" : {
    "username" : "noelhoppe",
    "role" : "USER"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON Antwort:
1. Nutzername leer → **400 (Bad Request)**
```JSON
{
  "message" : "Der Nutzername darf nicht leer sein."
}
```

2. Passwort leer → **400 (Bad Request)**
```JSON
{
  "message" : "Das Paswort darf nicht leer sein."
}
```

3. Nutzername _oder_ Passwort falsch → **400 (Bad Request)**
```JSON
{
  "message" : "Nutzername oder Passwort ist falsch."
}
```

4. Datenbank- und/oder Serverfehler, u.a falscher Datentyp → **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

---

> Endpunkt: POST /logout  
> Der Benutzer meldet sich von der Anwendung ab.

Statuscode (erfolgreich) : **200 (Ok)**

JSON-Antwort:
```JSON
{
  "message" : "Logout erfolgreich.",
  "user" : {
    "username" : "noelhoppe",
    "role" : "USER"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON Antwort:

1. Kein Session-Objekt verfügar, d.h es ist kein Benutzer angemeldet → **500 (Internal Server Error)**
```JSON
{
  "message" : "Die Sitzung ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an."
}
```

### Benutzerverwaltung (Rolle Admin)

---

> Endpunkt: GET /users
> Der Nutzer mit der Rolle Admin kann alle Nutzerkonten anzeigen.

Statuscode (erfolgreich) : **200 (Ok)**  

JSON-Antwort:  
```JSON
{
  "users" : [
    {
      "username" : "noelhoppe",
      "role" : "ADMIN"
    },
    {
      "username" : "johanneshaeuser",
      "role" : "USER"
    }
  ]
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Datenbank- und/oder Serverfehler → **500 (Internale Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

2. ausführender User ist kein Admin → **403 (Forbidden)**
```JSON
{
  "message" : "Sie haben keine Berechtigung diese Funktion auszuführen. Bitte kontaktieren sie ihren Administrator."
}
```

---

> GET /users/:users_username  
> Der Nutzer mit der Rolle Admin kann nach Nutzern suchen und diese anzeigen.

Statuscode (erfolgreich) : **200 (Ok)**  

JSON-Antwort:
```JSON
{
  "user" : {
    "username" : "Noel Hoppe",
    "role" : "ADMIN"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Angegebener Nutzer nicht gefunden → **404 (Not Found)**
```JSON
{
  "message" : "Der angegebene Benutzer wurde nicht gefunden."
}
```

2. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss ein String sein!"
}
```

3. Datenbank- und/oder Serverfehler → **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

4. ausführender User ist kein Admin → **403 (Forbidden)**
```JSON
{
  "message" : "Sie haben keine Berechtigung diese Funktion auszuführen. Bitte kontaktieren sie ihren Administrator."
}
```

---

> Endpunkt: POST /users  
> Der Nutzer mit der Rolle Admin kann Nutzer mit einem Benutzernamen und Passwort hinzufügen.
 
Statusode (erolgreich) : **201 (Created)**  

JSON-Anfrage:
```JSON
{
  "user" : {
    "username" : "noelhoppe",
    "pasword" : "___"
  }
}
```

JSON-Antwort:
```JSON
{
  "message": "Benutzer erfolgreich angelegt",
  "user": {
    "username": "noelhoppe",
    "role" : "USER"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Versuch, einen Nutzer ohne Username zu erstellen → **400 (Bad Request)**
```JSON
{
  "message" : "Das Feld Username darf nicht leer sein."
}
```

2. Versuch, einen Nutzer ohne Paswort zu erstellen → **400 (Bad Request)**
```JSON
{
  "message" : "Das Feld Pasword darf nicht leer sein."
}
```
3. Username existiert bereits → **409 (Conflict)**
```JSON
{
  "message" : "Dieser Username ist bereits vergeben. Bitte wählen sie einen noch nicht belegten Username."
}
```

4. Datenbank- und/oder Serverfehler → **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

5. ausführender User ist kein Admin → **403 (Forbidden)**
```JSON
{
  "message" : "Sie haben keine Berechtigung diese Funktion auszuführen. Bitte kontaktieren sie ihren Administrator."
}
```

---

> Endpunkt: PATCH /users/:users_username
> Der Nutzer mit der Rolle Admin kann Nutzerkonten bearbeiten, d.h den Benutzernamen und/oder das Passwort ändern

Statuscode(erfolgreich) : 200 (Ok)

JSON-Anfrage 1 (Passswort ändern)
```JSON
{
   "password" : "___"
}
```

JSON-Anfrage 2 (Nutzername ändern)
```JSON
{
   "username" : "neuer_benutzername"
}
```

JSON-Antwort 1
```JSON
{
   "message" : "Passwort erfolgreich geändert."
}
```

JSON-Antwort 2
```JSON
{
   "message" : "Benutzername erfolgreich geändert.",
   "users" : {
      "username": "neuer_benutzername"
   }
}
```

---

> Endpunkt: DELETE /users/:users_username  
> Der Benutzer mit der Rolle Admin kann Nutzerkonten löschen.

Statuscode (erfolgreich) : **204 (No Content)**

Mögliche Fehler, inkl. Statuscodes und JSON Fehlermeldung
1. Nutzer existiert nicht → **404 (Not Found)**
```JSON
{
  "message" : "Der angegebene Benutzer existiert nicht."
}
```

2. Dem Nutzer sind noch Fotos zugewiesen → **409 (Conflict)**
```JSON
{
  "message" : "Dem Nutzer sind noch Fotos zugewiesen"
}
```

3. Datenbank- und/oder Serverfehler → **500 (Internal Server Error)**
```JSON
{
  "message" : "EIn interner Servefehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

4. Username ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültiger Nutzername. Username muss ein String sein!"
}
```
5. ausführender User ist kein Admin → **403 (Forbidden)**
```JSON
{
  "message" : "Sie haben keine Berechtigung diese Funktion auszuführen. Bitte kontaktieren sie ihren Administrator."
}
```

---

### Fotos

---

> Endpunkt: GET /photos  
> Ein Nutzer fragt seine gesamten Fotos an.

Statusode (erfolgreich): **200 (Ok)**

JSON-Antwort:  
```JSON
{
  "photos" : [
    {
      "title" : "Weihnachtsmarkt",
      "taken" : "2023-12-12",
      "url" : "___"
    },
    {
      "title" : "Silvesterparty",
      "taken" : "2023-12-31",
      "url" : "___"
    }
  ]
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Datenbank- und/oder Serverfehler →  **500 (Internale Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

2. Der Nutzer hat keine Fotos → **404 (Not Found)**
```JSON
{
  "message" : "Der Benutzer hat keine Fotos."
}
```

3. Angegebener Nutzer exisitert nicht → **400 (Bad Request)**
```JSON
{
  "message" : "Der angegebene Benutzer wurde nicht gefunden."
}
```

4. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```

---

> Endpunkt: GET /photos/:suchparameter  
> Ein Nutzer durchsucht seine Fotos nach Titel und Schlagworte und zeigt die Treffer an.

Statuscode (erfolgreich) : **200 (Ok)**

JSON-Antwort:
```JSON
{
  "photo" : {
    "title" : "Weihnachtsmarkt",
    "taken" : "2023-12-12",
    "url" : "___"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Angegebenes Foto nicht gefunden → **404 (Not Found)**
```JSON
{
  "message" : "Das angegebene Foto wurde nicht gefunden."
}
```

2. Datenbank- und/oder Serverfehler => **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

3. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```

---

> Endpunkt: POST /photos  
> Ein Nutzer erstellt ein neues Foto mit einem Bild, Titel und Erstelldatum (Pflichtfelder) sowie optionalen Schlagwörtern.

Statusode (erolgreich) : 201 (Created)

JSON-Anfrage 1:
```JSON
{
  "photo" : {
    "title" : "Weihnachtsmarkt",
    "taken" : "2023-12-12",
    "url" : "___"
  },
  "tags" : [
    {
      "name" : "Party"
    },
    {
      "name" : "Freunde"
    }
  ]
}
```

JSON-Antwort 1:
```JSON
{
  "message": "Foto erfolgreich angelegt",
  "photo": {
    "title": "Weihnachtsmarkt",
    "taken" : "2023-12-12",
    "url" : "images/..."
  },
  "tags" : [
    {
      "name" : "Party"
    },
    {
      "name" : "Freunde"
    }
  ]
}
```

JSON-Anfrage 2:
```JSON
{
  "photo" : {
    "title" : "Weihnachtsmarkt",
    "taken" : "2023-12-12",
    "url" : "___"
  }
}
```

JSON-Antwort 2:
```JSON
{
  "message": "Foto erfolgreich angelegt",
  "photo": {
    "title": "Weihnachtsmarkt",
    "taken" : "2023-12-12",
    "url" : "images/..."
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Versuch, ein Bild ohne Titel zu erstellen → **400 (Bad Request)** 
```JSON
{
  "message" : "Das Feld Titel darf nicht leer sein."
}
```

2. Versuch, ein Foto ohne Datum zu erstellen → **400 (Bad Request)**
```JSON
{
  "message" : "Das Feld Datum darf nicht leer sein."
}
```

3. Versuch, ein Foto ohne Bilddatei zu erstellen → **400 (Bad Request)**
```JSON
{
  "message" : "Das Feld Bild darf nicht leer sein."
}
```

4. Datenbank- und/oder Serverfehler → **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

5. Angegebener Nutzer exisitert nicht → **400 (Bad Request)**
```JSON
{
  "message" : "Der angegebene Benutzer wurde nicht gefunden."
}
```

6. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```

---

> Endpunkt: PATCH /photos/:photos_ID/:suchparameter


---

> Endpunkt: DELETE /photos/:photos_ID

Statuscode (erfolgreich): 204 (No Content)

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort

1. Foto exisitert nicht  → **404 (Not Found)**
```JSON
{
  "message" : "Das angegebene Foto wurde nicht gefunden"
}
```

2. Datenbank- und/oder Serverfehler → **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

3. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```



---

### Fotolaben

---

> Endpuntkt: GET /albums  
> Ein Nutzer zeigt seine gesamten Alben an. 

Statusode (erfolgreich): **200 (Ok)**

JSON-Antwort:

```JSON
{
   "users_ID": 1,
   "albums": [
      {
         "ID": 1,
         "title": "Meine Fotos",
         "photos": [
            {
               "ID": 1,
               "title": "Weihnachtsmarkt",
               "taken": "2023-12-12",
               "url": "___"
            },
            {
               "ID": 2,
               "title": "Silvesterparty",
               "taken": "2023-12-31",
               "url": "___"
            }
         ]
      },
      {
         "ID": 2,
         "title": "Meine anderen Fotos",
         "photos": [
            {
               "ID": 3,
               "title": "Landschaft",
               "taken": "2007-05-01",
               "url": "___"
            },
            {
               "ID": 4,
               "title": "Urlaub",
               "taken": "2023-07-28",
               "url": "___"
            }
         ]
      }
   ]
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Datenbank- und/oder Serverfehler →  **500 (Internale Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

2. Der Nutzer hat keine Alben → **404 (Not Found)**
```JSON
{
  "message" : "Der Benutzer hat keine Alben."
}
```

3. Angegebener Nutzer exisitert nicht → **400 (Bad Request)**
```JSON
{
  "message" : "Der angegebene Benutzer wurde nicht gefunden."
}
```

4. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```

---

> Endpunkt: GET /albums/:albums_ID


Statuscode (erfolgreich) : **200 (Ok)**

JSON-Antwort:
```JSON
{
  "users_ID" : 1,
   "album":
      {
         "ID": 1,
         "title": "Meine Fotos",
         "photos": [
            {
               "ID": 1,
               "title": "Weihnachtsmarkt",
               "taken": "2023-12-12",
               "url": "___"
            },
            {
               "ID": 2,
               "title": "Silvesterparty",
               "taken": "2023-12-31",
               "url": "___"
            }
         ]
      }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Angegebenes Album nicht gefunden → **404 (Not Found)**
```JSON
{
  "message" : "Das angegebene Album wurde nicht gefunden."
}
```

2. Datenbank- und/oder Serverfehler => **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

3. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```


---

> Endpunkt: POST /albums
> Ein Nutzer erstellt ein Album mit einem Titel (Pflichtfeld) und optionalen Schagwörtern.

Statusode (erolgreich) : 201 (Created)

JSON-Anfrage 1:
```JSON
{
  "album" : {
    "title" : "Noch mehr Fotos"
  },
  "tags" : [
    {
      "name" : "Bilder"
    },
    {
      "name" : "Fotos"
    }
  ]
}
```

JSON-Antwort 1:
```JSON
{
  "message": "Album erfolgreich angelegt",
  "album": {
    "id" : 3,
    "title": "Noch mehr Fotos"
  },
  "tags" : [
    {
      "name" : "Bilder"
    },
    {
      "name" : "Fotos"
    }
  ]
}
```

JSON-Anfrage 2:
```JSON
{
  "album" : {
    "title" : "Noch mehr Fotos"
  }
}
```

JSON-Antwort 2:
```JSON
{
  "message": "Album erfolgreich angelegt",
  "album": {
    "id" : 3,
    "title": "Noch mehr Fotos"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Versuch, ein Album ohne Titel zu erstellen → **400 (Bad Request)**
```JSON
{
  "message" : "Das Feld Titel darf nicht leer sein."
}
```

4. Datenbank- und/oder Serverfehler → **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

5. Angegebener Nutzer exisitert nicht → **400 (Bad Request)**
```JSON
{
  "message" : "Der angegebene Benutzer wurde nicht gefunden."
}
```

6. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```

---

> Endpunkt: PATCH /albums/:albums_ID

---

> Endpunkt: DELETE /albums/:albums_ID

Statuscode (erfolgreich): 204 (No Content)

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort

1. Album exisitert nicht  → **404 (Not Found)**
```JSON
{
  "message" : "Das angegebene Album wurde nicht gefunden"
}
```

2. Datenbank- und/oder Serverfehler → **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

4. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```

---

# Auflistung der erfüllten und nicht erfüllten Anforderungen

---

# Falls zutreffend/umgesetzt: Auflistung von erfüllten optionalen Bonusaufgaben

---
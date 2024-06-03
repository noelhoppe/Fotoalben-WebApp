# ERM Diagramm inklusive kurzer Beschreibung

## Tabelle: Users
> Passwörter, die gehasht gespeichert werden, haben eine feste Länge VARCHAR(x)

| Schlüssel | Feldbeschreibung                          |
|-----------|-------------------------------------------|
| PK        | ID INTEGER AUTO_INCREMENT                 |
|           | username VARCHAR(30) UNIQUE NOT NULL      |
|           | password (DATENTYP???) NOT NULL           |
|           | role ENUM('ADMIN', 'USER') DEFAULT 'USER' |

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
**WICHTIG:**
1. Wie möchten wir die Fotos in der Datenbank speichern
2. Wie übertragen wird das Passwort mit JSON bei der Anfrage des Clients
   und bei der Antwort des Servers?
3. Restlichen Routen nach definieren Schema vervollständigen

FRAGEN:
- wenn nutzer bild nicht gehört 404 oder 403
- bei patch nochmal alle Infos übertragen?

TODO:
- patch routen
- album erstellen: kann direkt ein Bild übergeben werden
- Passwort in response???
- Routen um Bilder mit album zu verbinden/zu trennen

## Basis-URL
Die Basis-URL für alle Endpunkte lautet: `http://localhost:8080`

## Beschreibung der Endpunkte

### Login & Logout

---

> Endpunkt: POST /login

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
    "ID" : 1,
    "username" : "noelhoppe",
    "password" : "___",
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

4. Datenbank- und/oder Serverfehler → **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

---

> Endpunkt: POST /logout

Statuscode (erfolgreich) : **200 (Ok)**

JSON-Antwort:
```JSON
{
  "message" : "Logout erfolgreich.",
  "user" : {
    "id" : 1,
    "username" : "noelhoppe",
    "password" : "___",
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

Statuscode (erfolgreich) : **200 (Ok)**  

JSON-Antwort:  
```JSON
{
  "users" : [
    {
      "ID" : 1,
      "username" : "noelhoppe",
      "password" : "___",
      "role" : "ADMIN"
    },
    {
      "ID" : 2,
      "username" : "johanneshaeuser", 
      "password" : "_____",
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

2. ausführender User ist kein Admin  → **403 (Forbidden)**
```JSON
{
  "message" : "Sie haben keine Berechtigung diese Funktion auszuführen. Bitte kontaktieren sie ihren Administrator."
}
```

---

> GET /users/:users_ID  

Statuscode (erfolgreich) : **200 (Ok)**  

JSON-Antwort:
```JSON
{
  "user" : {
    "ID" : 1, 
    "username" : "Noel Hoppe",
    "password" : "___",
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
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```

3. Datenbank- und/oder Serverfehler → **500 (Internal Server Error)**
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

4. ausführender User ist kein Admin  → **403 (Forbidden)**
```JSON
{
  "message" : "Sie haben keine Berechtigung diese Funktion auszuführen. Bitte kontaktieren sie ihren Administrator."
}
```

---

> Endpunkt: POST /users  
 
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
    "id" : 1,
    "username": "noelhoppe",
    "password" : "___",
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
Username existiert bereits → **409 (Conflict)**
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

5. ausführender User ist kein Admin  → **403 (Forbidden)**
```JSON
{
  "message" : "Sie haben keine Berechtigung diese Funktion auszuführen. Bitte kontaktieren sie ihren Administrator."
}
```

---

> Endpunkt: PATCH /users/:users_ID   

---

> Endpunkt: DELETE /users/:user_ID

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

4. User ID ungültig (falscher Datentyp) → **400 (Bad Request)**
```JSON
{
  "message" : "Ungültige Nutzer-ID. Nutzer-ID muss eine Zahl sein!"
}
```
5. ausführender User ist kein Admin  → **403 (Forbidden)**
```JSON
{
  "message" : "Sie haben keine Berechtigung diese Funktion auszuführen. Bitte kontaktieren sie ihren Administrator."
}
```

---

### Fotos

---

> Endpunkt: GET /photos/users/:user_id  

Statusode (erfolgreich): **200 (Ok)**

JSON-Antwort:  
```JSON
{
  "users_ID" : 1,
  "photos" : [
    {
      "ID" : 1,
      "title" : "Weihnachtsmarkt",
      "taken" : "2023-12-12",
      "url" : "___"
    },
    {
      "ID" : 2,
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

> Endpunkt: GET /photos/:photos_ID/users/:users_ID  

Statuscode (erfolgreich) : **200 (Ok)**

JSON-Antwort:
```JSON
{
  "users_ID" : 1,
  "photo" : {
    "ID" : 1, 
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

> Endpunkt: POST /photos/users/:users_ID

Statusode (erolgreich) : 201 (Created)

JSON-Anfrage:
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

JSON-Antwort:
```JSON
{
  "message": "Foto erfolgreich angelegt",
  "photo": {
    "id" : 1,
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

> Endpunkt: PATCH /photos/:photos_ID/users/:users_ID

---

> Endpunkt: DELETE /photos/:photos_ID/users/:users_ID

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

> Endpuntkt: GET /albums/users/:users_ID

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

> Endpunkt: GET /albums/:albums_ID/users/:users_ID


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

> Endpunkt: POST /albums/users/:users_ID

Statusode (erolgreich) : 201 (Created)

JSON-Anfrage:
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

JSON-Antwort:
```JSON
{
  "message": "Album erfolgreich angelegt",
  "album": {
    "id" : 3,
    "title": "Noch mehr Fotos",
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

> Endpunkt: PATCH /albums/:albums_ID/users/:users_ID

---

> Endpunkt: DELETE /albums/:albums_ID/users/:users_ID

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
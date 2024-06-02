# Beschreibung der RESTful-API
**WICHTIG:**
1. Wie möchten wir die Fotos in der Datenbank speichern
2. Wie übertragen wird das Passwort mit JSON bei der Anfrage des Clients
und bei der Antwort des Servers?
3. Restlichen Routen nach definieren Schema vervollständigen

> Endpunkt: POST /login  

Statuscode (erfolgreich) : 201 (Created)

JSON-Anfrage:
```JSON
{
  "user" : {
    "username" : "noelhoppe"
  }
}
```

JSON-Response:
```JSON
{
  "message" : "Login erfolgreich.",
  "sessionID" : "a1b2c3d4e5f6g7h8i9j0",
  "user" : {
    "ID" : 1,
    "username" : "noelhoppe",
    "role" : "USER"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscode und JSON Antwort:
1. Nutzername leer => 400 (Bad Request)
```JSON
{
  "message" : "Der Nutzername darf nicht leer sein."
}
```

2. Passwort leer => **400 (Bad Request)**
```JSON
{
  "message" : "Das Paswort darf nicht leer sein."
}
```

3. Nutzername _oder_ Passwort falsch => 400 (Bad Request)
```JSON
{
  "message" : "Nutzername oder Passwort ist falsch."
}
```

4. Datenbank- und/oder Serverfehler => 500 (Internal Server Error)
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

> Endpunkt: POST /logout

Statuscode (erfolgreich) : 200 (Ok)

JSON-Antwort:
```JSON
{
  "message" : "Logout erfolgreich.",
  "user" : {
    "id" : 1,
    "username" : "noelhoppe",
    "role" : "USER"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscode und JSON Antwort:

1. Kein Session-Objekt verfügar, d.h es ist kein Benutzer angemeldet => 500 (Internal Server Error)
```JSON
{
  "message" : "Die Sitzung ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an."
}
```

> Endpunkt: GET /users

Statuscode (erfolgreich) : 200 (Ok)  
JSON-Antwort:  
```JSON
{
  "users" : [
    {
      "ID" : 1,
      "username" : "noelhoppe"
    },
    {
      "ID" : 2,
      "username" : "johanneshaeuser"
    }
  ]
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Datenbank- und/oder Serverfehler => 500 (Internale Server Error)
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

> GET /users/:users_ID  

Statuscode (erfolgreich) : 200 (Ok)  

JSON-Antwort:
```JSON
{
  "user" : {
    "ID" : 1, 
    "username" : "Noel Hoppe"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Angegebener Nutzer nicht gefunden => 404 (Not Found)
```JSON
{
  "message" : "Der angegebene Benutzer wurde nicht gefunden."
}
```

2. Datenbank- und/oder Serverfehler => 500 (Internal Server Error)
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

> Endpunkt: POST /users  
 
Statusode (erolgreich) : 201 (Created)  

JSON-Anfrage:
```JSON
{
  "username" : "noelhoppe",
  "pasword" : "___",
  "role" : "USER"
}
```

JSON-Antwort:
```JSON
{
  "message": "Benutzer erfolgreich angelegt",
  "user": {
    "id" : 1,
    "username": "noelhoppe",
    "role" : "USER"
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Versuch, einen Nutzer ohne Username zu erstellen.
```JSON
{
  "message" : "Das Feld Username darf nicht leer sein."
}
```

2. Versuch, einen Nutzer ohne Paswort zu erstellen.
```JSON
{
  "message" : "Das Feld Pasword darf nicht leer sein."
}
```

3. Versuch, einen Nutzer ohne Rolle zu erstellen.
```JSON
{
  "message" : "Das Feld Role darf nicht leer sein."
}
```

4. Datenbank- und/oder Serverfehler => 500 (Internal Server Error)
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

> Endpunkt: PATCH /users/:users_ID   



> Endpunkt: DELETE /users/:user_ID

Statuscode (erfolgreich) : 204 (No Content)

Mögliche Fehler, inkl. Statuscode und JSON Fehlermeldung
1. Nutzer existiert nicht => 404 (Not Found)
```JSON
{
  "message" : "Der angegebene Benutzer existiert nicht."
}
```

2. Dem Nutzer sind noch Fotos zugewiesen => 409 (Conflict)
```JSON
{
  "message" : "Dem Nutzer sind noch Fotos zugewiesen"
}
```

3. Datenbank- und/oder Serverfehler => 500 (Internal Server Error)
```JSON
{
  "message" : "EIn interner Servefehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

> Endpunkt: GET /photos/users/:user_id  

Statusode (erfolgreich): 200 (Ok)

JSON-Antwort:  
```JSON
{
  "users_ID" : 1,
  "photos" : [
    {
      "ID" : 1,
      "title" : "Weihnachtsmarkt",
      "taken" : "2023-12-12",
      "url" : "/images/..."
    },
    {
      "ID" : 2,
      "title" : "Silvesterparty",
      "url" : "/images/..."
    }
  ]
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Datenbank- und/oder Serverfehler => 500 (Internale Server Error)
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

> Endpunkt: GET /photos/:photos_ID/users/:users_ID  

Statuscode (erfolgreich) : 200 (Ok)

JSON-Antwort:
```JSON
{
  "users_ID" : 1,
  "photo" : {
    "ID" : 1, 
    "title" : "Weihnachtsmarkt",
    "taken" : "2023-12-12",
    "url" : "/images/..."
  }
}
```

Mögliche Fehler, inkl. entsprechender Statuscodes und JSON-Antwort
1. Angegebenes Foto nicht gefunden => 404 (Not Found)
```JSON
{
  "message" : "Das angegebene Foto wurde nicht gefunden."
}
```

2. Datenbank- und/oder Serverfehler => 500 (Internal Server Error)
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```

> Endpunkt: POST /photos/users/:users_ID

Statusode (erolgreich) : 201 (Created)

JSON-Anfrage:
```JSON
{
  "photo" : {
    "title" : "Weihnachtsmarkt",
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
1. Versuch, ein Bild ohne Titel zu erstellen.
```JSON
{
  "message" : "Das Feld Titel darf nicht leer sein."
}
```

2. Versuch, ein Foto ohne Datum zu erstellen.
```JSON
{
  "message" : "Das Feld Datum darf nicht leer sein."
}
```

3. Versuch, ein Foto ohne Bilddatei zu erstellen.
```JSON
{
  "message" : "Das Feld Bild darf nicht leer sein."
}
```

4. Datenbank- und/oder Serverfehler => 500 (Internal Server Error)
```JSON
{
  "message" : "Ein interner Severfehler ist aufgetreten. Bitte versuchen Sie es später erneut."
}
```



> Endpunkt: PATCH /photos/:photos_ID/users/:users_ID

> Endpunkt: DELETE /photos/:photos_ID/users/:users_ID

> Endpuntkt: GET /alben/users/:users_ID

> Endpunkt: GET /alben/:alben_ID/users/:users_ID

> Endpunkt: POST /alben/users/:users_ID

> Endpunkt: PATCH /alben/:alben_ID/users/:users_ID

> Endpunkt: DELETE /alben/:alben_ID/users/:users_ID
# Beschreibung der RESTful-API

> POST /login  
> Gibt Statuscode 303 mit entsprechenden Location-Header zurück, wenn der Login erfolgreich war, d.h. das Paar Benutzername und Passwort existiert.  
> Die Passwörter sind mit Bcrypt (round 10) gehasht in der Datenbank gespeichert.

http-Request
```JSON
{
  "username" : "___",
  "password" : "___"
}
```

http-Response
1. Gibt Statuscode 500 zurück, wenn der username oder das password null sind oder die Anfrage an die Route falsch formatiert ist.
```JSON
{
  "message": "Die Anfrage muss folgendes Format haben und die keys username und password sind nicht null-Werte",	  
  "username": "___",
  "password": "___"
}
```
2. Gibt Statuscode 400 zurück, wenn der Benutzername Leerzeichen enthält.
```JSON
{
  "message": "Der Nutzername darf keine Leerzeichen enthalten"
}
```

3. Gibt Statuscode 400 zurück, wenn das Passwort Leerzeichen enthält.
```JSON
{
  "message": "Das Passwort darf keine Leerzeichen enthalten"
}
```

4. Gibt Statuscode 400 zurück, wenn der Benutzername leer ist.
```JSON
{
  "message": "Der Nutzername darf nicht leer sein"
}
```

5. Gibt Statuscode 400 zurück, wenn das Password leer ist.
```JSON
{
  "message": "Das Passwort darf nicht leer sein"
}
```

6. Gibt Statuscode 400 zurück, wenn der Nutzername _oder_ das Passwort falsch ist.
```JSON
{
  "message": "Nutzername oder Passwort falsch"
}
```

7. Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist.



---



> GET /username  
> Eine Route, um den Nutzernamen des Benutzs abzurufen und im Frontend anzuzeigen.

```JSON
{
	"username": "noel"
}
```

1. Gibt Statuscode 401 mit entsprechender Fehlermeldung zurück, wenn der Benutzer nicht angemeldet ist.
```JSON
{
	"message": "Bitte melde dich zuerst an, um diese Route aufrufen zu dürfen."
}
```



---


> GET /role  
> Eien Route, um die Rolle des Benutzers abzufragen. Im Frontend wird je nach Rolle der Button zum Admin-Tool angezeigt.

1. Gibt Statuscode 401 mit entsprechender Fehlermeldung zurück, wenn der Benutzer nicht angemeldet ist.
```JSON
{
	"message": "Bitte melde dich zuerst an, um diese Route aufrufen zu dürfen."
}
```


---



> POST /logout  
> Statuscode 303 mit Location-Header auf die login.html Seite

1. Die Session ist bereits zerstört, also ungültig.
```JSON
{
	"message": "Die Session ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an"
}
```


---



> GET /photos

1. Gibt Statuscode 200 und JSON mit allen Fotoinformationen inklusive Tags als kommaseparierter String zurück.
```JSON
{
	"photos": [
		{
			"id": 1,
			"title": "dasda",
			"taken": "2022-12-02",
			"imgUrl": "1.jpg",
			"tags": null
		},
		{
			"id": 2,
			"title": "test",
			"taken": "2012-12-12",
			"imgUrl": "2.jpg",
			"tags": null
		}
	]
}
```

2. Gibt Statuscode 401 mit entsprechender Fehlermeldung zurück, wenn der Benutzer nicht angemeldet ist.
```JSON
{
	"message": "Bitte melde dich zuerst an, um diese Route aufrufen zu dürfen."
}
```

3. Gibt Statuscode 500 mit Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist.


---


> GET /img/:photoID
> Sendet das Bild mit der entsprechenden ID.  
> Namenskonvention. Jedes Bild ist mit ID.jpg gespeichert.

1. Wenn kein Benutzer angemeldet ist, wird die http-Anfrage hier mit einem 401 Unauthorized und einer entsprechenden Fehlermeldung abgewiesen.
```JSON
{
	"message": "Bitte melde dich zuerst an, um diese Route aufrufen zu dürfen."
}
```

2. Gibt Statuscode 404 mit entsrechender Fehlermeldung zurück, wenn das Bild nicht gefunden wurde.
```JSON
{
	"message": "Das Foto wurde nicht gefunden."
}
```

3. Gibt Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Foto nicht dem Benutzer gehört.
```JSON
{
	"message": "Das Foto gehört nicht dem Benutzer"
}
```

4. Statuscode 400 mit entsprechender Fehlermeldung, wenn die imageID (Pfadparameter) keine gültige Zahl ist.
```JSON
{
	"message": "photoID muss eine gültige Zahl sein"
}
```


---



> DELETE /tag  
> Statuscode 204, wenn der Tag erfolgreich gelöscht wurde.

http-Request
```JSON
{
  "photoID" : 1,
  "tag" : "___"
}
```

1. Wenn kein Benutzer angemeldet ist, wird die http-Anfrage hier mit einem 401 Unauthorized und einer entsprechenden Fehlermeldung abgewiesen.
```JSON
{
	"message": "Bitte melde dich zuerst an, um diese Route aufrufen zu dürfen."
}
```
2. Gebe Statuscode 400 mit enstsprechender Fehlermeldung zurück, wenn der Nutzer das Feld photoID nicht korrekt ausfüllt
```JSON
{
	"message": "photoID muss das Format Zahl.jpg haben"
}
```

3. Gebe Statuscode 400 mit ensprechender Fehlermeldung zurück, wenn der das Feld tag leer ist, Leerzeichen enthält oder null ist
```JSON
{
  "message" : "Der Tag darf keine Leerzeichen enthalten"
}
```

```JSON
{
  "message" : "Der Tag darf nicht leer sein"
}
```

```JSON
{
  "message" : "tag darf nicht null sein"
}
```

4. Gibt Statuscode 404 mit entsrechender Fehlermeldung zurück, wenn das Bild nicht gefunden wurde.
```JSON
{
	"message": "Das Foto wurde nicht gefunden."
}
```

5. Gibt Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Foto nicht dem Benutzer gehört.
```JSON
{
	"message": "Das Foto gehört nicht dem Benutzer"
}
```

6. Statuscode 500 mit entsprechender Fehlermeldung, wenn ein Server- und/oder Datenbankfehler auftritt



---



> POST /tag  
> Gebe Statuscode 201 mit entsprechender Erfolgsmelsung zurück, wenn Tag erfolgreich angelegt wurde.  

http-Anfrage
```JSON
{
  "photoID" : 1,
  "tag" : "___"
}
```

1. Wenn kein Benutzer angemeldet ist, wird die http-Anfrage hier mit einem 401 Unauthorized und einer entsprechenden Fehlermeldung abgewiesen.
```JSON
{
	"message": "Bitte melde dich zuerst an, um diese Route aufrufen zu dürfen."
}
```

2. Statuscode 400 mit entsprechender Fehlermeldung, wenn die imageID (Pfadparameter) keine gültige Zahl ist.
```JSON
{
	"message": "photoID muss eine gültige Zahl sein"
}
```

3. Gebe Statuscode 400 mit ensprechender Fehlermeldung zurück, wenn der das Feld tag leer ist, Leerzeichen enthält oder null ist
```JSON
{
  "message" : "Der Tag darf keine Leerzeichen enthalten"
}
```

```JSON
{
  "message" : "Der Tag darf nicht leer sein"
}
```

```JSON
{
  "message" : "tag darf nicht null sein"
}
```

4. Gibt Statuscode 404 mit entsrechender Fehlermeldung zurück, wenn das Bild nicht gefunden wurde.
```JSON
{
	"message": "Das Foto wurde nicht gefunden."
}
```

5. Gibt Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Foto nicht dem Benutzer gehört.
```JSON
{
	"message": "Das Foto gehört nicht dem Benutzer"
}
```

6. Statuscode 409, wenn der Tag bereits existiert.
```JSON
{
  "message" : "Der Tag existiert bereits"
}
```


---



> PATCH /photoTitle

http-Anfrage

```JSON
{
  "photoID" : 1,
  "photoTitle" : "___"
}
```

1. Statuscode 200  mit entsprechdner Erfolgsmeldung und dem neuen Titel, wenn der Titel des Fotos geändert wurde
```JSON
{
  "message" : "Der Fototitel wurder erfolgreich geändert",
  "photoTitle" : "___"
}
```

2. Wenn kein Benutzer angemeldet ist, wird die http-Anfrage hier mit einem 401 Unauthorized und einer entsprechenden Fehlermeldung abgewiesen.
```JSON
{
	"message": "Bitte melde dich zuerst an, um diese Route aufrufen zu dürfen."
}
```

3. Statuscode 400 mit entsprechender Fehlermeldung, wenn die imageID (Pfadparameter) keine gültige Zahl ist.
```JSON
{
	"message": "photoID muss eine gültige Zahl sein"
}
```

4. Statuscode 400, wenn der Titel leer ist bzw. nur aus Leerzeichen besteht.
```JSON
{
  "message" : "Der Titel darf nicht leer sein"
}
```

5. Gibt Statuscode 404 mit entsrechender Fehlermeldung zurück, wenn das Bild nicht gefunden wurde.
```JSON
{
	"message": "Das Foto wurde nicht gefunden."
}
```

6. Gibt Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Foto nicht dem Benutzer gehört.
```JSON
{
	"message": "Das Foto gehört nicht dem Benutzer"
}
```


---

> PATCH /photoDate

http-Anfrage:
```JSON
{
  "photoID" : 1,
  "date" : "___"
}
```

1. Gibt Statuscode 200 mit enstprechender Erfolgsmeldung zurück, wenn der Titel des Bildes erfolgreich geändert wurde. 
```JSON
{
  "message" : "Das Datum des Fotos wurde erfolgreich geändert",
  "newDate" : "___"
}
```

2. Gibt Statuscode 401 mit entsprechender Fehlermeldung zurück, wenn der Benutzer nicht angemeldet ist.
```JSON
{
	"message": "Bitte melde dich zuerst an, um diese Route aufrufen zu dürfen."
}
```

3. Statuscode 400 mit entsprechender Fehlermeldung, wenn die imageID (Pfadparameter) keine gültige Zahl ist.
```JSON
{
	"message": "photoID muss eine gültige Zahl sein"
}
```

4. Gibt Statuscode 404 mit entsrechender Fehlermeldung zurück, wenn das Bild nicht gefunden wurde.
```JSON
{
	"message": "Das Foto wurde nicht gefunden."
}
```

5. Gibt Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Foto nicht dem Benutzer gehört.
```JSON
{
	"message": "Das Foto gehört nicht dem Benutzer"
}
```

6. Gebe Status 400 mit entsprechender Fehlermeldung zurück, wenn das Datum nicht korrekt formatiert ist oder in der Zukunft liegt.  
```JSON
{
  "message" : "Ungültiges Feld date: Das Datum muss im Format 'YYYY-MM-DD' vorliegen und in der Vergangenheit liegen"
}
```

7. Gebe Statusocde 500 mit entpsrechender Fehlermeldung zurück, wenn ein Server und/oder Datenbankfehler aufgetreten ist.
```JSON
{
  "message" : "Ein interner Serverfehler ist aufgetreten"
}
```


---


> DELETE /img/:photoID  
> Gibt Statuscode 204 zurück, wenn das Foto erfolgreich gelöscht wurde.

1. Gibt Statuscode 401 mit entsprechender Fehlermeldung zurück, wenn der Benutzer nicht angemeldet ist.
```JSON
{
	"message": "Bitte melde dich zuerst an, um diese Route aufrufen zu dürfen."
}
```

2. Statuscode 400 mit entsprechender Fehlermeldung, wenn die imageID (Pfadparameter) keine gültige Zahl ist.
```JSON
{
	"message": "photoID muss eine gültige Zahl sein"
}
```

3. Gibt Statuscode 404 mit entsrechender Fehlermeldung zurück, wenn das Bild nicht gefunden wurde.
```JSON
{
	"message": "Das Foto wurde nicht gefunden."
}
```

4. Gibt Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Foto nicht dem Benutzer gehört.
```JSON
{
	"message": "Das Foto gehört nicht dem Benutzer"
}
```

5. Statuscode 500, wenn ein Fehler beim Löschen des Fotos aufgetreten ist.
```JSON
{
  "message" : "Fehler beim Löschen des Fotos"
}
```
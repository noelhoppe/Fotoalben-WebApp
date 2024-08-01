package de.thm.mni.photoalbums.handler;

import com.sun.tools.javac.Main;
import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;
import io.vertx.ext.web.FileUpload;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class PhotoHandler {
	JDBCPool jdbcPool;

	public PhotoHandler(JDBCPool jdbcPool) {
		this.jdbcPool = jdbcPool;
	}

	/**
	 * Handler für GET /photos <br>
	 * Gibt Statuscode 200 und JSON mit allen Fotoinformationen inklusive Tags als kommaseparierter String zurück.<br>
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist. <br>
	 * @param ctx Routing Context
	 */
	public void getAllPhotosFromUser(RoutingContext ctx) {
		System.out.print("called getAllPhotosFromUsers in PhotoHandler.java");
		Integer userIdStr = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);
		jdbcPool.preparedQuery("""
				SELECT p.ID, p.title, p.taken, p.url, GROUP_CONCAT(t.name SEPARATOR ', ') as tags
    				FROM Photos p
    				LEFT JOIN PhotosTags pt
        					ON pt.Photos_ID = p.ID
    				LEFT JOIN Tags t
        					ON pt.TAGS_ID = t.ID
    				WHERE p.Users_ID = ?
    				GROUP BY p.ID, p.title, p.taken, p.url
				""")
			.execute(Tuple.of(userIdStr), res -> {
				if (res.succeeded()) {
					RowSet<Row> rows = res.result();
					JsonArray photos = new JsonArray();
					for (Row row : rows) {
						JsonObject photo = new JsonObject();
						photo.put("id", row.getLong("ID"));
						photo.put("title", row.getString("title"));
						photo.put("taken", row.getLocalDate("taken").toString());
						photo.put("imgUrl", row.getString("url"));
						photo.put("tags", row.getString("tags"));
						photos.add(photo);
					}
					MainVerticle.response(ctx.response(), 200, new JsonObject().put("photos", photos));
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut")
					);
				}
			});
	}

	/**
	 * Sendet das Foto
	 * @param ctx Routing Context
	 */
	public void servePhotos(RoutingContext ctx) {
		System.out.println("called servePhotos in PhotoHandler.java");
		ctx.response().sendFile("img/" + ctx.data().get("photoID") + ctx.data().get("fileExtension"));
	}


	/**
	 * Prüft, ob das Bild in der Datenbank existiert.<br>
	 * Wenn ja, rufe den nächsten Handler auf.<br>
	 * Wenn nein, beende die Anfrage mit einem 404 und entsprechender Fehlermeldung<br>
	 * @param ctx Der Routing Context
	 */
	public void photoExists(RoutingContext ctx) {
		System.out.println("called photoExits in PhotoHandler.java");
		Integer photoID = Integer.valueOf(ctx.data().get("photoID").toString());
		jdbcPool.preparedQuery("SELECT COUNT(*) as count FROM Photos WHERE ID = ?")
			.execute(Tuple.of(photoID), res -> {
				if (res.succeeded() && res.result().iterator().next().getInteger("count") == 1) {
					ctx.next();
				} else {
					MainVerticle.response(ctx.response(), 404, new JsonObject().put("message", "Das Foto wurde nicht gefunden."));
				}
			});
	}

	/**
	 * Prüft, ob das Bild dem Nutzer zugewiesen ist.
	 * Wenn ja, rufe den nächsten Handler auf.
	 * Wenn nein, beende die Anfrage mit einem 403 und entsprechender Fehlermeldung
	 * @param ctx
	 */
	public void photoIsUser(RoutingContext ctx) {
		System.out.println("called photoIsUser in PhotoHandler.java");
		Integer photoID = Integer.valueOf(ctx.data().get("photoID").toString());
		Integer userId = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);
		jdbcPool.preparedQuery("SELECT COUNT(*) as count FROM Photos WHERE ID = ? AND Users_ID = ?")
			.execute(Tuple.of(photoID, userId), res -> {
				if (res.succeeded() && res.result().iterator().next().getInteger("count") == 1) {
					ctx.next();
				} else {
					MainVerticle.response(ctx.response(), 403, new JsonObject()
						.put("message", "Das Foto gehört nicht dem Benutzer")
					);
				}
			});
	}

	/**
	 * Prüft, ob die photoID eine gültige Zahl ist. <br>
	 * Wenn ja, rufe den nächsten Handler auf.<br>
	 * Wenn nein, beende die http-Anfrage mit dem Statuscode 400 und einer entsprechenden Fehlermeldung.<br>
	 * @param ctx Routing Context
	 */
	public void validatePhotoInputReq(RoutingContext ctx) {
		System.out.println("called validatePhotoInputReq in PhotoHandler.java");
		try {
			int photoIDInt = Integer.parseInt(ctx.data().get("photoID").toString());
			ctx.data().put("photoID", photoIDInt);
			ctx.next();
		} catch (NumberFormatException e) {
			e.printStackTrace();
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "photoID muss eine gültige Zahl sein")
			);
		}
	}

	/**
	 * Prüft, ob das Feld tag leer ist, Leerzeichen enthält oder null ist. <br>
	 * Wenn ja, gebe Statuscode 400 mit entsprechender Fehlermeldung zurück.<br>
	 * Wenn nein, rufe den nächsten Handler auf.<br>
	 * @param ctx Routing Context
	 */
	public void validateTagInputReq(RoutingContext ctx) {
		System.out.println("called validateTagInputReq in PhotoHandler.java");
		try {
			String tag = ctx.data().get("tag").toString();
			if (tag == null) {
				throw new IllegalArgumentException();
			}

			if (tag.contains(" ")) {
				MainVerticle.response(ctx.response(), 400, new JsonObject()
					.put("message", "Der Tag darf keine Leerzeichen enthalten")
				);
			}

			if (tag.trim().isEmpty()) {
				MainVerticle.response(ctx.response(), 400, new JsonObject()
					.put("message", "Der Tag darf nicht leer sein")
				);
			}
			ctx.next();

		} catch (IllegalArgumentException e) {
			e.printStackTrace();
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "tag darf nicht null sein")
			);
		}
	}


	/**
	 * Gibt Statuscode 204 zurück, wenn der Tag erfolgreich vom Foto gelöscht wurde. <br>
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist<br>
	 * @param ctx Routing Context
	 */
	public void deleteTag(RoutingContext ctx) {
		System.out.println("called deleteTag in PhotoHandler.java");
		Integer photoID = Integer.valueOf(ctx.data().get("photoID").toString());
		String tag = ctx.data().get("tag").toString();

		getTagId(tag).onComplete(ar -> {
			if (ar.succeeded()) {
				jdbcPool.preparedQuery("DELETE FROM PhotosTags WHERE Photos_ID = ? AND Tags_ID = ? ")
					.execute(Tuple.of(photoID, ar.result()), res -> {
						if (res.succeeded()) {
							ctx.response()
								.setStatusCode(204)
								.end();
						} else {
							MainVerticle.response(ctx.response(), 500, new JsonObject()
								.put("message", "Fehler beim Löschen des Tags")
							);
						}
					});
			}
		});
	}

	/**
	 * Handler für POST /tag <br>
	 * Gibt Statuscode 201 mit entsprechender Erfolgsmeldung zurück, wenn der Tag erfolgreich zum Foto hinzugefügt wurde.<br>
	 * Gibt Statuscode 400 mit entsprechender Fehlermeldung zurück, wenn der Tag Leerzeichen enthält.<br>
	 * Gibt Statuscode 400 mit entsprechender Fehlermeldung zurück, wenn der Tag leer is.<br>
	 * Gibt Statuscode 401 mit entsprechender Fehlermeldung zurück, wenn ein Nutzer versucht Tags zu Fotos eines anderen Benutzers hinzuzufügen. <br>
	 * Gibt Statuscode 409 mit entsprechender Fehlermeldung zurück, wenn ein Nutzer versucht einen Tag hinzuzufügen, der bereits dem entsprechenden Foto zugewiesen ist.
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist.
	 * @param ctx Routing Context
	 */
	public void addTagToPhoto(RoutingContext ctx) {
		System.out.println("called addTagToPhoto in PhotoHandler.java");

		Integer photoID = Integer.valueOf(ctx.data().get("photoID").toString());
		String tag = ctx.data().get("tag").toString();

		getTagId(tag).onComplete(res -> {
			if (res.succeeded()) {
				jdbcPool.preparedQuery("INSERT INTO  PhotosTags VALUES (?, ?)")
					.execute(Tuple.of(photoID, res.result()), dbRes -> {
						if (dbRes.succeeded()) {
							MainVerticle.response(ctx.response(), 201, new JsonObject()
								.put("message", "Tag erfolgreich zum Foto hinzugefügt")
							);
						} else {
							MainVerticle.response(ctx.response(), 409, new JsonObject()
								.put("message", "Der Tag existiert bereits")
							);
						}
					});
			} else {
				addTagToTableTags(tag).onComplete(ar -> {
					if (ar.succeeded()) {
						jdbcPool.preparedQuery("INSERT INTO  PhotosTags VALUES (?, ?)")
							.execute(Tuple.of(photoID, res.result()), dbRes -> {
								if (dbRes.succeeded()) {
									MainVerticle.response(ctx.response(), 201, new JsonObject()
										.put("message", "Tag erfolgreich zum Foto hinzugefügt")
									);
								} else {
									MainVerticle.response(ctx.response(), 409, new JsonObject()
										.put("message", "Der Tag existiert bereits")
									);
								}
							});
					} else {
						MainVerticle.response(ctx.response(), 500, new JsonObject()
							.put("message", "Ein interner Serverfehler ist aufgetreten")
						);
					}
				});
			}
		});
	}


	/**
	 *
	 * @param tag Der tag, der überprüft werden soll
	 * @return
	 */
	Future<Integer> getTagId(String tag) {
		System.out.println("called tagExistsInTableTags in PhotoHandler.java");

		Promise<Integer> promise = Promise.promise();

		jdbcPool.preparedQuery("SELECT ID FROM Tags WHERE Tags.name = ?")
			.execute(Tuple.of(tag), res -> {
				if (res.succeeded() && res.result().size() == 1) {
					promise.complete(res.result().iterator().next().getInteger("ID"));
				} else {
					promise.fail(res.cause());
				}
			});

		return promise.future();
	}

	Future<Integer> addTagToTableTags(String tag) {
		System.out.println("called addTagToTableTags in PhotoHandler.java");

		Promise<Integer> promise = Promise.promise();

		jdbcPool.preparedQuery("INSERT INTO Tags (name) VALUES (?)")
			.execute(Tuple.of(tag), res -> {
				if (res.succeeded()) {
					promise.complete(res.result().property(JDBCPool.GENERATED_KEYS).getInteger(0));
				}  else {
					promise.fail(res.cause());
				}
			});

		return promise.future();
	}

	/**
	 * Prüft, ob der Fototitel nur aus Leerzeichen besteht, also leer ist. <br>
	 * Wenn ja, gebe Statuscode 400 mit entsprechender Fehlermeldung zurück. <br>
	 * Wenn nein, gebe die Anfrage an den nächsten Handler weiter <br>
	 * @param ctx Routing Context
	 */
	public void validatePhotoTitleReq(RoutingContext ctx) {
		System.out.println("called validatePhotoTitleReq in PhotoHandler.java");

		String photoTitle = ctx.data().get("photoTitle").toString();

		if (photoTitle.trim().isEmpty()) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Titel darf nicht leer sein")
			);
		} else {
			ctx.next();
		}
	}


	/**
	 *
	 * @param ctx
	 */
	public void  editPhotoTitle(RoutingContext ctx) {
		System.out.println("called editPhotoTitle in PhotoHandler.java");

		String photoTitle = ctx.data().get("photoTitle").toString();

		jdbcPool.preparedQuery("UPDATE Photos SET title = ? WHERE Photos.ID = ?")
			.execute(Tuple.of(photoTitle, ctx.data().get("photoID")), res -> {
				if (res.succeeded()) {
					MainVerticle.response(ctx.response(), 200, new JsonObject()
						.put("message", "Der Fototitel wurde erfolgreich geändert")
						.put("photoTitle", photoTitle)
					);
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * Handler für PATCH /photoDate <br>
	 * Gebe Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn date nicht korrekt nach folgenden Schema formatiert ist 'YYYY-MM-DD' <br>
	 * Gebe Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Feld photoID kein gültiger Wert ist. <br>
	 * @param ctx Routing Context
	 */
	public void handleEditPhotoDate(RoutingContext ctx) {
		System.out.println("called handleEditPhotoDate in PhotoHandler.java");

		String date = ctx.body().asJsonObject().getString("date");

		if (!isValidDate(date)) {
			MainVerticle.response(ctx.response(), 404, new JsonObject()
				.put("message", "Ungültiges Feld date: Das Datum muss im Format 'YYYY-MM-DD' vorliegen und in der Vergangenheit liegen")
			);
			return;
		}

		jdbcPool.preparedQuery("UPDATE Photos SET taken = ? WHERE Photos.ID = ?")
			.execute(Tuple.of(date, ctx.data().get("photoID")), res -> {
				if (res.succeeded()) {
					MainVerticle.response(ctx.response(), 200, new JsonObject()
						.put("message", "Das Datum des Fotos wurde erfolgreich geändert")
						.put("newDate", date)
					);
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 *
	 * @param date Das Datum als String, das geparst werden soll
	 * @return true, wenn das Datum im Format YYYY-MMM-DD vorliegt und in der Vergangenheit liegt; false sonst
	 */
	private boolean isValidDate(String date) {
		System.out.println("called isValidDate in PhotoHandler.java");

		try {
			LocalDate parsedDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
			return !parsedDate.isAfter(LocalDate.now());
		} catch(DateTimeParseException e) {
			return false;
		}
	}



public void uploadPhoto(RoutingContext ctx){

    int testID = 1;
    String testTitle = "testname"; //generiert duplikate --> FEHLER!!
    String photoTitle = ctx.request().getFormAttribute("title");
    String photoDate = ctx.request().getFormAttribute("taken");
    System.out.println(photoTitle);
    System.out.println(photoDate);

    if (photoTitle.trim().isEmpty()) {
      MainVerticle.response(ctx.response(), 400, new JsonObject()
        .put("message", "Der Titel darf nicht leer sein"));
    }

    if (photoTitle.contains(" ")) {
    MainVerticle.response(ctx.response(), 400, new JsonObject()
      .put("message", "Der Titel darf keine Leerzeichen entahlten"));
  }

  if (photoTitle.length() >= 30) {
    MainVerticle.response(ctx.response(), 400, new JsonObject()
      .put("message", "Der Titel darf maximal 30 Zeichen lang sein!"));
  }

    //TODO: Datum überprüfen, TAGS implementieren!!


    if (ctx.fileUploads().isEmpty()){
      MainVerticle.response(ctx.response(), 400, new JsonObject()
        .put("message", "Es wurde keine Bilddatei mitgesendet"));
    }

    for (FileUpload file : ctx.fileUploads()) {
      String fileNameOriginal = file.fileName();
      String fileExtension = fileNameOriginal.substring(fileNameOriginal.lastIndexOf("."));
      String mimeType = file.contentType();

      if (!mimeType.equals("image/png") && !mimeType.equals("image/jpeg")) {
            //TODO: FILE vertx.fileSystem().delete löschen implementieren
            //TODO: Lässt FileSystem ungültige Dateinamen zu oder gibt es ein Error -> wenn nicht einzeln als Error implementieren
        MainVerticle.response(ctx.response(), 400, new JsonObject()
          .put("message", "Die hochgeladene Datei muss eine Bilddatei des Typs JPEG oder PNG sein"));

      }

      // --DATABASE--

      jdbcPool.preparedQuery("""
                       			INSERT INTO photos
                        		     (Users_ID, title, taken, url)
                        		     VALUES (?, ?, ?, ?)
                        			"""
      ).execute(Tuple.of(testID, photoTitle, photoDate, testTitle), res -> {
        if (res.succeeded()) {
          //1. rename File
          //2. edit database
          System.out.println("Filename" + file.fileName());
          MainVerticle.response(ctx.response(), 201, new JsonObject()
            .put("message", "Foto wurde erfolgreich hochgeladen!"));
        } else {
          System.err.println("Error: " + res.cause().getMessage());
          MainVerticle.response(ctx.response(), 500, new JsonObject()
            .put("message", "Fehler beim Upload des Fotos")
          );
        }
      });





    }
    //TODO: DATENBANK implementierung!
    //TODO: Bild wird aktuell mit random NAME und ohne Dateiendung abgelegt
  // TODO: iat nutzer angemeldet???
}

}

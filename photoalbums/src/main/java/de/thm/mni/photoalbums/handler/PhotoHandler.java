package de.thm.mni.photoalbums.handler;

import com.sun.tools.javac.Main;
import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.Session;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.vertx.ext.web.FileUpload;

import java.sql.ResultSet;
import java.sql.SQLException;
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
	 * Prüft, ob der Nutzer das Bild anfragen darf, d.h ob es dem Nutzer zugewiesen ist und sendet es zurück.<br>
	 * Gibt Statuscode 403 mit entsprechender Fehlermeldung zurück, wenn der Nutzer ein Bild anfragt, welches ihm nicht zugewiesen ist.<br>
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist.<br>
	 * @param ctx Routing Context
	 */
	public void servePhotos(RoutingContext ctx) {
		String imageId = ctx.pathParam("imageId");
		Integer userId = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);
		// System.out.println("userId: " + userId);
		// System.out.println("imageId: " + imageId);

		// Überprüfung der userId auf null
		if (userId == null) {
			MainVerticle.response(ctx.response(), 403, new JsonObject()
				.put("message", "Unautorisierter Zugriff auf das Bild")
			);
			return;
		}

		jdbcPool.preparedQuery("SELECT url FROM Photos WHERE url = ? AND Users_ID = ?")
			.execute(Tuple.of(imageId, userId), res -> {
				if (res.succeeded() && res.result().size() > 0) {
					String imagePath = "img/" + imageId;
					ctx.response().sendFile(imagePath).onFailure(err -> {
						MainVerticle.response(ctx.response(), 500, new JsonObject()
							.put("message", "Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut")
						);
					});
				} else {
					MainVerticle.response(ctx.response(), 403, new JsonObject()
						.put("message", "Unautorisierter Zugriff auf das Bild")
					);
				}
			});
	}

	/**
	 * Handler für DELETE /tag <br>
	 * Gibt Statuscode 204 zurück, wenn der Tag erfolgreich vom Foto gelöscht wurde. <br>
	 * Gibt Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Foto nicht gefunden wurde.<br>
	 * Gibt Statuscode 401 mit entsprechender Fehlermeldung zurück, wenn ein Nutzer versucht Tags von Bildern eines anderen Benutzers zu entfernen.<br>
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist<br>
	 * @param ctx Routing Context
	 */
	public void deleteTag(RoutingContext ctx) {
		String tagName = ctx.body().asJsonObject().getString("tag");
		String photoId = ctx.body().asJsonObject().getString("imgId");
		System.out.println(tagName);
		System.out.println(photoId);

		jdbcPool.preparedQuery("SELECT * FROM Photos WHERE Photos.ID = ?")
			.execute(Tuple.of(photoId), res -> {
				if (res.succeeded()) {
					RowSet<Row> rows = res.result();
					if (rows.size() == 0) {
						MainVerticle.response(ctx.response(), 404, new JsonObject()
							.put("message", "Foto nicht gefunden")
						);
						return;
					}
					for (Row row : rows) {
						if (row.getInteger("Users_ID") != ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID)) {
							MainVerticle.response(ctx.response(), 401, new JsonObject()
								.put("message", "Es können nur Tags von eigenen Fotos entfernt werden")
							);
							return;
						}
					}

					// Wenn der Benutzer berechtigt ist, den Tag zu löschen
					jdbcPool.preparedQuery("""
                       				DELETE pt
                        				FROM PhotosTags pt
                        				LEFT JOIN Tags t
                        					ON pt.TAGS_ID = t.ID
                        				WHERE t.name = ? AND pt.Photos_ID = ?
                        			"""
					).execute(Tuple.of(tagName, photoId), res2 -> {
						if (res2.succeeded()) {
							ctx.response().setStatusCode(204).end();
						} else {
							MainVerticle.response(ctx.response(), 500, new JsonObject()
								.put("message", "Fehler beim Löschen des Tags")
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
		final Integer photoID = ctx.body().asJsonObject().getInteger("photoID");
		final String tagName = ctx.body().asJsonObject().getString("tagName");

		if (tagName.contains(" ")) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Tag darf keine Leerzeichen enthalten")
			);
			return;
		}

		if (tagName.trim().isEmpty()) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Tag darf nicht leer sein")
			);
			return;
		}

		jdbcPool.preparedQuery("SELECT Users_ID FROM Photos WHERE ID = ?")
				.execute(Tuple.of(photoID), res -> {
					if (res.succeeded() && res.result().size() == 1) {
						for (Row row : res.result()) {
							if (row.getInteger("Users_ID") != ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID)) {
								MainVerticle.response(ctx.response(), 401, new JsonObject()
									.put("message", "Es können ausschließlich Tags zu eigenen Fotos hinzugefügt werden")
								);
								return;
							}
						}

						// Der Benutzer ist berechtigt, den Tag hinzuzufügen
						jdbcPool.preparedQuery("SELECT * FROM Tags WHERE Tags.name = ?")
							.execute(Tuple.of(tagName), res1 -> {
								if (res1.succeeded() && res1.result().size() == 1) { // Der Tag existiert bereits in der Tags Tabelle
									RowSet<Row> rows = res1.result();
									for (Row row : rows) {
										final Integer tagId = row.getInteger("ID");
										jdbcPool.preparedQuery("INSERT INTO PhotosTags VALUES (?, ?)")
											.execute(Tuple.of(photoID, tagId), res2 -> {
												if (res2.succeeded()) {
													MainVerticle.response(ctx.response(), 201, new JsonObject()
														.put("message", "Der Tag wurde dem Foto hinzugefügt")
													);
												} else {
													MainVerticle.response(ctx.response(), 409, new JsonObject()
														.put("message", "Der Tag existiert bereits")
													);
												}
											});
									}
								} else { // Der Tag existiert noch nicht in der Tags Tabelle
									jdbcPool.preparedQuery("INSERT INTO Tags (name) VALUES(?)")
										.execute(Tuple.of(tagName), res3 -> {
											if (res3.succeeded()) {
												Integer generatedTagId = res3.result().property(JDBCPool.GENERATED_KEYS).getInteger(0);
												jdbcPool.preparedQuery("INSERT INTO PhotosTags VALUES (?, ?)")
													.execute(Tuple.of(photoID, generatedTagId), res4 -> {
														if (res4.succeeded()) {
															MainVerticle.response(ctx.response(), 201, new JsonObject()
																.put("message", "Der Tag wurde dem Foto hinzugefügt")
															);
														} else {
															MainVerticle.response(ctx.response(), 409, new JsonObject()
																.put("message", "Der Tag existiert bereits")
															);
														}
													});
											} else {
												MainVerticle.response(ctx.response(), 500, new JsonObject()
													.put("message", "Fehler beim Hinzufügen des Tags zur Tags Tabelle")
												);
											}
										});
								}
							});
					} else {
						MainVerticle.response(ctx.response(), 500, new JsonObject()
							.put("message", "Ein interner Serverfehler ist aufgetreten")
						);
					}
				});
	}

	/**
	 * Handler für PATCH /photoTitle <br>
	 * Gibt Statuscode 400 mit entsprechender Fehlermeldung zurück, wenn der Titel leer ist bzw. nur aus Leerzeichen besteht. <br>
	 * Gibt Statuscode 401 mit entsprechender Fehlermeldung zurück, wenn ein Nutzer versucht, den Titel eines Bildes eines anderen Nutzers zu bearbeiten. <br>
	 * Gibt Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Bild nicht existiert.
	 * Gibt Statuscode 500 zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist.
	 *
	 * @param ctx Routing Context
	 */
	public void  editPhotoTitle(RoutingContext ctx) {
		Integer photoID = ctx.body().asJsonObject().getInteger("photoID");
		String photoTitle = ctx.body().asJsonObject().getString("photoTitle");

		/*
		jdbcPool.preparedQuery("SELECT * FROM Photos WHERE ID = ?")
			.execute(Tuple.of(photoID), res -> {
				if (res.succeeded() && res.result().size() == 0) {
					MainVerticle.response(ctx.response(), 404, new JsonObject()
						.put("message", "Das Bild existiert nicht")
					);
				}
			});

		 */

		photoExists(photoID, ctx).onComplete(res -> {
			if (res.succeeded() && !res.result()) {
				MainVerticle.response(ctx.response(), 404, new JsonObject()
					.put("message", "Das Bild existiert nicht")
				);
				return;
			}

			if (photoTitle.trim().isEmpty()) {
				MainVerticle.response(ctx.response(), 400, new JsonObject()
					.put("message", "Der Titel darf nicht leer sein")
				);
				return;
			}

			jdbcPool.preparedQuery("SELECT Users_ID FROM Photos WHERE ID = ?")
				.execute(Tuple.of(photoID), res2 -> {
					if (res.succeeded() && res2.result().size() >= 1) {
						RowSet<Row> rows = res2.result();
						for (Row row : rows) {
							if (row.getInteger("Users_ID") != ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID)) {
								MainVerticle.response(ctx.response(), 401, new JsonObject()
									.put("message", "Nutzer dürfen nur die Titel ihrer eigenen Fotos bearbeiten")
								);
								return;
							}
						}
						// Der Nutzer bearbeitet seinen eigenen Fototitel
						jdbcPool.preparedQuery("UPDATE Photos SET Photos.Title = ? WHERE Photos.ID = ?")
							.execute(Tuple.of(photoTitle, photoID), res3 -> {
								if (res3.succeeded()) {
									MainVerticle.response(ctx.response(), 200, new JsonObject()
										.put("message", "Der Fototitel wurde erfolgreich geändert")
										.put("photoTitle", photoTitle)
									);
								} else {
									MainVerticle.response(ctx.response(), 500, new JsonObject()
										.put("message", "Es ist ein Fehler beim Ändern des Fototitels aufgetreten")
									);
								}
							});
					} else {
						MainVerticle.response(ctx.response(), 500, new JsonObject()
							.put("message", "Ein interner Serverfehler ist aufgetreten")
						);
					}
				});
		});
	}

	/**
	 * Handler für PATCH /photoDate <br>
	 * Gebe Statuscode 403 mit entsprechender Fehlermeldung zurück, wenn das Foto nicht dem Nutzer gehört, der die Route aufruft. <br>
	 * Gebe Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Foto nicht in der Datenbank existiert. <br>
	 * Gebe Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn date nicht korrekt nach folgenden Schema formatiert ist 'YYYY-MM-DD' <br>
	 * Gebe Statuscode 404 mit entsprechender Fehlermeldung zurück, wenn das Feld photoID kein gültiger Wert ist. <br>
	 * @param ctx Routing Context
	 */
	public void handleEditPhotoDate(RoutingContext ctx) {
		Integer photoID;
		try {
			photoID = ctx.body().asJsonObject().getInteger("photoID");
		} catch(Exception e) {
			MainVerticle.response(ctx.response(), 404, new JsonObject()
				.put("message", "Ungültiges Feld photoID: Die photoID muss eine gültige Zahl vom Typ number sein")
			);
			return;
		}

		String date = ctx.body().asJsonObject().getString("date");
		if (!isValidDate(date)) {
			MainVerticle.response(ctx.response(), 404, new JsonObject()
				.put("message", "Ungültiges Feld date: Das Datum muss im Format 'YYYY-MM-DD' vorliegen und in der Vergangenheit liegen")
			);
		}






	}

	/**
	 *
	 * @param date Das Datum als String, das geparst werden soll
	 * @return true, wenn das Datum im Format YYYY-MMM-DD vorliegt und in der Vergangenheit liegt; false sonst
	 */
	private boolean isValidDate(String date) {
		try {
			LocalDate parsedDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
			return parsedDate.isBefore(LocalDate.now());
		} catch(DateTimeParseException e) {
			return false;
		}
	}

	/**
	 *
	 * @param photoId Die ID des Fotos (unique, weil PK)
	 * @param ctx Der RoutingContext
	 * @return true, wenn das Foto existiert; false sonst
	 */
	private Future<Boolean> photoExists(Integer photoId, RoutingContext ctx) {
		Promise<Boolean> promise = Promise.promise();

		jdbcPool.preparedQuery("SELECT COUNT(*) AS count FROM Photos WHERE ID = ?")
			.execute(Tuple.of(photoId), res -> {
				if (res.succeeded() && res.result().size() == 1) {
					if (res.result().iterator().next().getInteger("count") == 1) {
						promise.complete(true);
					} else {
						promise.complete(false);
					}
				} else {
					promise.complete(false);
				}
			});
		return promise.future();
	}





public void uploadPhoto(RoutingContext ctx){


    String photoTitle = ctx.request().getFormAttribute("title");
    String photoDate = ctx.request().getFormAttribute("date");

    if (photoTitle.trim().isEmpty()) {
      MainVerticle.response(ctx.response(), 400, new JsonObject()
        .put("message", "Der Titel darf nicht leer sein"));
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
        MainVerticle.response(ctx.response(), 400, new JsonObject()
          .put("message", "Die hochgeladene Datei muss eine Bilddatei des Typs JPEG oder PNG sein"));

      }



      System.out.println("Filename" + file.fileName());
    }
  MainVerticle.response(ctx.response(), 201, new JsonObject()
    .put("message", "Das Foto wurde hochgeladen!"));
    //TODO: DATENBANK implementierung und Fehlermeldungen!
    //TODO: Bild wird aktuell mit random NAME und ohne Dateiendung abgelegt
}

}

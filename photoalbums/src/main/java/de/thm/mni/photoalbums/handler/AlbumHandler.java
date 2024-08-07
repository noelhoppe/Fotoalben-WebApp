package de.thm.mni.photoalbums.handler;

import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.MultiMap;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;

import java.util.ArrayList;
import java.util.List;

public class AlbumHandler {

	private final JDBCPool jdbcPool;

	public AlbumHandler(JDBCPool jdbcPool) {
		this.jdbcPool = jdbcPool;
	}

	/**
	 * Handler für GET /albums <br>
	 * Gibt Statuscode 200 und JSON mit allen Alben-Informationen inklusive Tags als kommaseparierter String zurück.<br>
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist. <br>
	 *
	 * @param ctx Routing Context
	 */
	public void getAllAlbumsFromUser(RoutingContext ctx) {

		// Get userId from session
		Integer userIdStr = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);
		System.out.println(userIdStr);

		// Get query parameters
		String searchParam = ctx.request().params().get("searchParam");


		// Build the SQL query
		StringBuilder sql = new StringBuilder("""
			    SELECT a.ID, a.title, GROUP_CONCAT(t.name SEPARATOR ', ') as tags
			    FROM Albums a
			    LEFT JOIN AlbumsTags at
			              ON at.Alben_ID = a.ID
			    LEFT JOIN Tags t
			               ON at.TAGS_ID = t.ID
			   WHERE a.ID IN (
			   SELECT a_inner.ID
			              FROM Albums a_inner
			              LEFT JOIN AlbumsTags at_inner
			                     ON at_inner.Alben_ID = a_inner.ID
			              LEFT JOIN Tags t_inner
			                     ON at_inner.TAGS_ID = t_inner.ID
			              WHERE a_inner.Users_ID = ?
			""");

		List<Object> params = new ArrayList<>();
		params.add(userIdStr);

		if (searchParam != null && !searchParam.trim().isEmpty()) {
			sql.append("AND t_inner.name LIKE CONCAT('%', ?, '%') OR a_inner.title LIKE CONCAT('%', ?, '%')");
			params.add(searchParam);
			params.add(searchParam);
		}

		sql.append("""
			               GROUP BY a_inner.ID
			    )
			    GROUP BY a.ID, a.title
			""");


		jdbcPool.preparedQuery(sql.toString())
			.execute(Tuple.from(params), res -> {
				if (res.succeeded()) {
					RowSet<Row> rows = res.result();
					JsonArray albums = new JsonArray();
					for (Row row : rows) {
						JsonObject album = new JsonObject();
						album.put("id", row.getLong("ID"));
						album.put("title", row.getString("title"));
						album.put("tags", row.getString("tags"));
						albums.add(album);
					}
					MainVerticle.response(ctx.response(), 200, new JsonObject().put("albums", albums));
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut")
					);
				}
			});
	}

	/**
	 * Prüft, ob die albumID eine gültige Zahl ist. <br>
	 * Wenn ja, rufe den nächsten Handler auf.<br>
	 * Wenn nein, beende die http-Anfrage mit dem Statuscode 400 und einer entsprechenden Fehlermeldung.<br>
	 *
	 * @param ctx Routing Context
	 */
	public void validateAlbumInputReq(RoutingContext ctx) {
		try {
			int albumIDInt = Integer.parseInt(ctx.data().get("albumID").toString());
			ctx.data().put("albumID", albumIDInt);
			ctx.next();
		} catch (NumberFormatException e) {
			e.printStackTrace();
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "albumID muss eine gültige Zahl sein")
			);
		}
	}

	/**
	 * Prüft, ob das Album in der Datenbank existiert.<br>
	 * Wenn ja, rufe den nächsten Handler auf.<br>
	 * Wenn nein, beende die Anfrage mit einem 404 und entsprechender Fehlermeldung<br>
	 *
	 * @param ctx Der Routing Context
	 */
	public void albumExists(RoutingContext ctx) {
		Integer albumID = Integer.valueOf(ctx.data().get("albumID").toString());
		jdbcPool.preparedQuery("SELECT COUNT(*) as count FROM Albums WHERE ID = ?")
			.execute(Tuple.of(albumID), res -> {
				if (res.succeeded() && res.result().iterator().next().getInteger("count") == 1) {
					ctx.next();
				} else {
					MainVerticle.response(ctx.response(), 404, new JsonObject().put("message", "Das Album wurde nicht gefunden."));
				}
			});
	}

	/**
	 * Prüft, ob das Album dem Nutzer zugewiesen ist.
	 * Wenn ja, rufe den nächsten Handler auf.
	 * Wenn nein, beende die Anfrage mit einem 403 und entsprechender Fehlermeldung
	 *
	 * @param ctx
	 */
	public void albumIsUser(RoutingContext ctx) {
		Integer albumID = Integer.valueOf(ctx.data().get("albumID").toString());
		Integer userId = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);
		jdbcPool.preparedQuery("SELECT COUNT(*) as count FROM Albums WHERE ID = ? AND Users_ID = ?")
			.execute(Tuple.of(albumID, userId), res -> {
				if (res.succeeded() && res.result().iterator().next().getInteger("count") == 1) {
					ctx.next();
				} else {
					MainVerticle.response(ctx.response(), 403, new JsonObject()
						.put("message", "Das Album gehört nicht dem Benutzer")
					);
				}
			});
	}

	/**
	 * Bearbeiten des Albumtitels in der Datenbank, Statuscode 200 bei Erfolg<br>
	 * Statuscode 500 mit Fehlermeldung bei Misserfolg.
	 *
	 * @param ctx
	 */
	public void editAlbumTitle(RoutingContext ctx) {

		String albumTitle = ctx.data().get("title").toString();

		jdbcPool.preparedQuery("UPDATE Albums SET title = ? WHERE ID = ?")
			.execute(Tuple.of(albumTitle, ctx.data().get("albumID")), res -> {
				if (res.succeeded()) {
					MainVerticle.response(ctx.response(), 200, new JsonObject()
						.put("message", "Der Fototitel wurde erfolgreich geändert")
						.put("albumTitle", albumTitle)
					);
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * Prüft, ob der Albumtitel nur aus Leerzeichen besteht, also leer ist. <br>
	 * Prüft ob der Albumtitel länger als 30 Zeichen ist. <br>
	 * Wenn ja, gebe Statuscode 400 mit entsprechender Fehlermeldung zurück. <br>
	 * Wenn nein, gebe die Anfrage an den nächsten Handler weiter <br>
	 *
	 * @param ctx Routing Context
	 */
	public void validateAlbumTitleReq(RoutingContext ctx) {
		String albumTitle = ctx.data().get("title").toString();

		if (albumTitle.trim().isEmpty()) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Titel darf nicht leer sein")
			);
		} else if (albumTitle.length() > 30) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Titel darf maximal 30 Zeichen lang sein")
			);
		} else {
			ctx.next();
		}
	}

	/**
	 * Handler für POST /albums <br>
	 * Erstellt ein Album mit dem im RoutingContext hinterlegten title <br>
	 * Gibt Statuscode 201 zurück wenn erfolgreich <br>
	 * Gibt Statuscode 500 mit entprechender Meldung zurück wenn ein Server- oder Datenbankfehler auftritt <br>
	 *
	 * @param ctx
	 */
	public void createAlbum(RoutingContext ctx) {

		int currentUserID = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);
		String title = ctx.data().get("title").toString();

		jdbcPool.preparedQuery("""
				INSERT INTO Albums
				(Users_ID, title)
				VALUES (?, ?)
				""")
			.execute(Tuple.of(currentUserID, title), res -> {
				if (res.succeeded()) {
					MainVerticle.response(ctx.response(), 201, new JsonObject()
						.put("message", "ALbum erfolgreich angelegt!")
					);
				} else {
					System.err.println(res.cause().getMessage());
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Fehler beim erstellen des Albums")
					);
				}
			});
	}

	/**
	 * Wenn ein Album gelöscht wird, werden alle Fotos des Albums aus der Verbindungstabelle gelöscht und der nächste Handler wird aufgerufen<br>
	 * Gebe Statuscode 500 mit Fehlermeldung zurück, wenn ein Server - und/oder Datenbankfehler aufgetreten ist<br>
	 */
	public void deleteAlbumsPhotosConnections(RoutingContext ctx) {
		String albumID = ctx.pathParam("albumID");
		jdbcPool.preparedQuery("DELETE FROM AlbumsPhotos WHERE Albums_ID = ?")
			.execute(Tuple.of(albumID), res -> {
				if (res.succeeded()) {
					ctx.next();
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten.")
					);
				}
			});
	}

	/**
	 * Wenn ein Album gelöscht wird, werden alle Tags des Albums aus der Verbindungstabelle gelöscht und der nächste Handler wird aufgerufen<br>
	 * Gebe Statuscode 500 mit Fehlermeldung zurück, wenn ein Server - und/oder Datenbankfehler aufgetreten ist<br>
	 */
	public void deleteAlbumsTagsConnections(RoutingContext ctx) {
		String albumID = ctx.pathParam("albumID");
		jdbcPool.preparedQuery("DELETE FROM AlbumsTags WHERE Alben_ID = ?")
			.execute(Tuple.of(albumID), res -> {
				if (res.succeeded()) {
					ctx.next();
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten.")
					);
				}
			});
	}

	/**
	 * Lösche dsa entsprechende Album <br>
	 * Gebe Statuscode 500 mit Fehlermeldung zurück, wenn ein Server - und/oder Datenbankfehler aufgetreten ist<br>
	 */
	public void deleteFromAlbums(RoutingContext ctx) {
		String albumID = ctx.pathParam("albumID");
		jdbcPool.preparedQuery("DELETE FROM Albums WHERE ID = ?")
			.execute(Tuple.of(albumID), res -> {
				if (res.succeeded()) {
					ctx.response()
						.setStatusCode(204)
						.end();
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten.")
					);
				}
			});
	}

	/**
	 * @param tag Der tag, der überprüft werden soll
	 * @return
	 */
	Future<Integer> getTagId(String tag) {
		System.out.println("called getTagID in AlbumHandler.java");

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


	/**
	 * Erstellt einen Tag in der Tabelle Tags
	 *
	 * @param tag
	 * @return ID des erstellten Tags
	 */
	Future<Integer> addTagToTableTags(String tag) {
		System.out.println("called addTagToTableTags in albumHandler.java");

		Promise<Integer> promise = Promise.promise();

		jdbcPool.preparedQuery("INSERT INTO Tags (name) VALUES (?)")
			.execute(Tuple.of(tag), res -> {
				if (res.succeeded()) {
					promise.complete(res.result().property(JDBCPool.GENERATED_KEYS).getInteger(0));
				} else {
					promise.fail(res.cause());
				}
			});


		return promise.future();
	}


	/**
	 * Handler für POST /albums/tag <br>
	 * Gibt Statuscode 201 mit entsprechender Erfolgsmeldung zurück, wenn der Tag erfolgreich zum Foto hinzugefügt wurde.<br>
	 * Gibt Statuscode 400 mit entsprechender Fehlermeldung zurück, wenn der Tag Leerzeichen enthält.<br>
	 * Gibt Statuscode 400 mit entsprechender Fehlermeldung zurück, wenn der Tag leer is.<br>
	 * Gibt Statuscode 401 mit entsprechender Fehlermeldung zurück, wenn ein Nutzer versucht Tags zu Alben eines anderen Benutzers hinzuzufügen. <br>
	 * Gibt Statuscode 409 mit entsprechender Fehlermeldung zurück, wenn ein Nutzer versucht einen Tag hinzuzufügen, der bereits dem entsprechenden Album zugewiesen ist.
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist.
	 *
	 * @param ctx Routing Context
	 */

	public void addTagToAlbum(RoutingContext ctx) {

		Integer albumID = Integer.valueOf(ctx.data().get("albumID").toString());
		String tag = ctx.data().get("tag").toString();

		getTagId(tag).onComplete(res -> {                                           //existiert Tag bereits in Tabelle Tags
			if (res.succeeded()) {                                                    // -> ja Tag existiert in Tags
				jdbcPool.preparedQuery("INSERT INTO  AlbumsTags VALUES (?, ?)")       //füge Tag zu Album hinzu
					.execute(Tuple.of(albumID, res.result()), dbRes -> {
						if (dbRes.succeeded()) {
							MainVerticle.response(ctx.response(), 201, new JsonObject()
								.put("message", "Tag erfolgreich zum Album hinzugefügt")
							);
						} else {                                                            //Tag bereits zu Album hinzugefügt
							System.out.println(dbRes.cause().getMessage());
							MainVerticle.response(ctx.response(), 409, new JsonObject()
								.put("message", "Der Tag existiert bereits")
							);
						}
					});
			} else {                                                                  // -> nein Tag existiert noch nicht in Tags
				addTagToTableTags(tag).onComplete(ar -> {                               //erstelle Tag
					if (ar.succeeded()) {
						jdbcPool.preparedQuery("INSERT INTO  AlbumsTags VALUES (?, ?)")     //füge Tag zu Album hinzu
							.execute(Tuple.of(albumID, ar.result()), dbRes -> {
								if (dbRes.succeeded()) {
									MainVerticle.response(ctx.response(), 201, new JsonObject()
										.put("message", "Tag erfolgreich zum Album hinzugefügt")
									);
								} else {
									System.out.println(dbRes.cause().getMessage());
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
	 * Gibt Statuscode 204 zurück, wenn der Tag erfolgreich vom Foto gelöscht wurde. <br>
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist<br>
	 *
	 * @param ctx Routing Context
	 */
	public void deleteTagFromAlbum(RoutingContext ctx) {
		Integer albumID = Integer.valueOf(ctx.data().get("albumID").toString());
		String tag = ctx.data().get("tag").toString();

		getTagId(tag).onComplete(ar -> {
			if (ar.succeeded()) {
				jdbcPool.preparedQuery("DELETE FROM AlbumsTags WHERE Alben_ID = ? AND Tags_ID = ? ")
					.execute(Tuple.of(albumID, ar.result()), res -> {
						if (res.succeeded()) {
							/**
							 ctx.response()
							 .setStatusCode(204)
							 .end();
							 */
							ctx.next();
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
	 * Prüft ob ein Foto bereits in einem Album ist <br>
	 * Wenn ja, gebe Statuscode 409 mit entsprechender Fehlermeldung <br>
	 * Wenn nein, rufe den nächsten Handler auf <br>
	 * Gibt Statuscode 500 mit entsprechender Meldung zurück, wenn ein Datenback- oder Serverfehler auftritt <br>
	 *
	 * @param ctx
	 */
	public void validatePhotoNotInAlbum(RoutingContext ctx) {
		System.out.println("called validatePhotoNotInAlbum in albumHandler.java");
		jdbcPool.preparedQuery("SELECT COUNT(*) as count FROM AlbumsPhotos WHERE Albums_ID = ? AND Photos_ID = ?")
			.execute(Tuple.of(ctx.data().get("albumID"), ctx.data().get("photoID")), res -> {
				if (res.succeeded()) {
					Row row = res.result().iterator().next();
					int count = row.getInteger("count");
					if (count > 0) {
						MainVerticle.response(ctx.response(), 409, new JsonObject()
							.put("message", "Das gewählte Foto ist bereits in diesem Album")
						);
					} else {
						ctx.next();
					}
				} else {
					System.err.println(res.cause().getMessage());
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});
	}

  public void validatePhotoIsInAlbum(RoutingContext ctx) {
    System.out.println("called validatePhotoIsInAlbum in albumHandler.java");
    jdbcPool.preparedQuery("SELECT COUNT(*) as count FROM AlbumsPhotos WHERE Albums_ID = ? AND Photos_ID = ?")
      .execute(Tuple.of(ctx.data().get("albumID"), ctx.data().get("photoID")), res -> {
        if (res.succeeded()) {
          Row row = res.result().iterator().next();
          int count = row.getInteger("count");
          if (count > 0) {
            ctx.next();
          }else {
            MainVerticle.response(ctx.response(), 409, new JsonObject()
              .put("message", "Das gewählte Foto ist nicht in diesem Album")
            );
          }

				} else {
					System.err.println(res.cause().getMessage());
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * Fügt Foto zu einem Album hinzu (Tabelle AlbumsPhotos)
	 * Gibt Statuscode 201 zurück, wenn erfolgreich
	 * Gibt Statuscode 500 zurück, wenn ein Datenbank- oder Serverfehler auftritt
	 *
	 * @param ctx
	 */
	public void addPhotoToAlbum(RoutingContext ctx) {
		int albumID = Integer.parseInt(ctx.data().get("albumID").toString());
		int photoID = Integer.parseInt(ctx.data().get("photoID").toString());

		jdbcPool.preparedQuery("INSERT INTO  AlbumsPhotos VALUES (?, ?)")
			.execute(Tuple.of(photoID, albumID), res -> {
				if (res.succeeded()) {
					MainVerticle.response(ctx.response(), 201, new JsonObject()
						.put("message", "Foto wurde erfolgreich zum Album hinzugefügt")
					);
				} else {
					System.err.println(res.cause().getMessage());
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});

	}

	public void removePhotoFromAlbum(RoutingContext ctx) {
		int albumID = Integer.parseInt(ctx.data().get("albumID").toString());
		int photoID = Integer.parseInt(ctx.data().get("photoID").toString());
		System.out.println(albumID + " " + photoID);

    jdbcPool.preparedQuery("DELETE FROM AlbumsPhotos WHERE Photos_ID = ? AND Albums_ID = ?")
      .execute(Tuple.of(photoID, albumID), res -> {
        if (res.succeeded()) {
          ctx.response()
            .setStatusCode(204)
            .end();
        } else {
          System.err.println(res.cause().getMessage());
          MainVerticle.response(ctx.response(), 500, new JsonObject()
            .put("message", "Ein interner Serverfehler ist aufgetreten")
          );
        }
      });


	}

	/**
	 * Gibt Statuscode 200 und eine Liste aller Alben des Nutzers zurück (ID und Titel), <br>
	 * sowie zu jedem Album einen Boolean welcher angibt, ob das Album das übergebene Foto enthält <br>
	 * Gibt Statuscode 500 zurück, wenn ein Datenbank- oder Serverfehler auftritt
	 *
	 * @param ctx
	 */
	public void whichAlbumContainsPhoto(RoutingContext ctx) {
		int photoID = Integer.parseInt(ctx.data().get("photoID").toString());
		int currentUserID = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);

		jdbcPool.preparedQuery("""
				SELECT
				a.ID, a.title, COUNT(ap.Photos_ID) AS contains
				FROM
				  Albums a
				LEFT JOIN
				AlbumsPhotos ap ON a.ID = ap.Albums_ID AND ap.Photos_ID = ?
				WHERE
				a.Users_ID = ?
				GROUP BY
				a.ID, a.title
				""")
			.execute(Tuple.of(photoID, currentUserID), res -> {
				if (res.succeeded()) {
					RowSet<Row> rows = res.result();
					JsonArray albums = new JsonArray();
					for (Row row : rows) {
						JsonObject album = new JsonObject();
						album.put("id", row.getLong("ID"));
						album.put("title", row.getString("title"));
						if (row.getInteger("contains") > 0) {
							album.put("contains", true);
						} else {
							album.put("contains", false);
						}
						albums.add(album);
					}
					ctx.response()
						.setStatusCode(200)
						.end(albums.encodePrettily());
				} else {
					System.err.println(res.cause().getMessage());
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * Löscht das entsprechende Foto von allen Alben
	 *
	 * @param ctx
	 */
	public void removePhotoFromAllAlbums(RoutingContext ctx) {
		jdbcPool.preparedQuery("DELETE FROM AlbumsPhotos WHERE Photos_ID = ?")
			.execute(Tuple.of(ctx.data().get("photoID")), res -> {
				if (res.succeeded()) {
					ctx.next();
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});
	}

	Future<Boolean> tagHasRefInAlbumsTags(RoutingContext ctx) {
		Promise<Boolean> promise = Promise.promise();

		getTagId(ctx.data().get("tag").toString()).onComplete(ar -> {
			if (ar.succeeded()) {
				jdbcPool.preparedQuery("SELECT COUNT(*) AS count FROM AlbumsTags WHERE Tags_ID = ?")
					.execute(Tuple.of(ar.result()), res -> {
						if (res.succeeded() && res.result().iterator().next().getLong("count") > 0) {
							promise.complete(true);

						} else if (res.succeeded() && res.result().iterator().next().getLong("count") == 0) {
							promise.complete(false);
						} else {
							promise.fail(res.cause());
						}
					});
			} else {
				System.out.println("fail in tagHasRefInAlbumsTags");
				promise.fail(ar.cause());
			}
		});

		return promise.future();
	}

	Future<Boolean> tagHasRefInPhotosTags(RoutingContext ctx) {
		Promise<Boolean> promise = Promise.promise();

		getTagId(ctx.data().get("tag").toString()).onComplete(ar -> {
			if (ar.succeeded()) {
				jdbcPool.preparedQuery("SELECT COUNT(*) AS count FROM PhotosTags WHERE TAGS_ID = ?")
					.execute(Tuple.of(ar.result()), res -> {
						if (res.succeeded() && res.result().iterator().next().getLong("count") > 0) {
							promise.complete(true);
						} else if (res.succeeded() && res.result().iterator().next().getLong("count") == 0) {
							promise.complete(false);
						} else {
							promise.fail(res.cause());
						}
					});
			} else {
				System.out.println("fail in tagHasRefInPhotosTags");
				promise.fail(ar.cause());
			}
		});

		return promise.future();
	}

	public void garbageCollectorTagsTable(RoutingContext ctx) {
		Future<Boolean> tagHasRefInPhotosFuture = tagHasRefInPhotosTags(ctx);
		Future<Boolean> tagHasRefInAlbumsFuture = tagHasRefInAlbumsTags(ctx);

		CompositeFuture.all(tagHasRefInPhotosFuture, tagHasRefInAlbumsFuture).onComplete(ar -> {
			if (ar.succeeded()) {
				boolean tagInPhotos = tagHasRefInPhotosFuture.result();
				boolean tagInAlbums = tagHasRefInAlbumsFuture.result();

				if (!tagInPhotos && !tagInAlbums) {

					getTagId(ctx.data().get("tag").toString()).onComplete(asynRes -> {
						if (asynRes.succeeded()) {
							jdbcPool.preparedQuery("DELETE FROM Tags WHERE ID = ?")
								.execute(Tuple.of(asynRes.result()), res -> {
									if (res.succeeded()) {
										ctx.response()
											.setStatusCode(204)
											.end();
									} else {
										System.out.println("!res.succeeded(): " + res.cause());
										MainVerticle.response(ctx.response(), 500, new JsonObject()
											.put("message", "Ein interner Serverfehler ist aufgetreten")
										);
									}
								});

						} else {
							MainVerticle.response(ctx.response(), 500, new JsonObject()
								.put("message", "Ein interner Serverfehler ist aufgetreten")
							);
						}
					});
				} else {
					ctx.response()
						.setStatusCode(204)
						.end();
				}
			} else {
				System.out.println("Future schlägt fehl");
				MainVerticle.response(ctx.response(), 500, new JsonObject()
					.put("message", "Ein interner Serverfehler ist aufgetreten")
				);
			}
		});
	}
}

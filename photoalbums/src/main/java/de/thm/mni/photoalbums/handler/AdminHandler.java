package de.thm.mni.photoalbums.handler;

import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;
import org.mindrot.jbcrypt.BCrypt;

import java.util.ArrayList;
import java.util.List;

public class AdminHandler {
	private final JDBCPool jdbcPool;

	public AdminHandler(JDBCPool jdbcPool) {
		this.jdbcPool = jdbcPool;
	}

	/**
	 * Gibt Statuscode 200 mit entsprechender Erfolgsmeldung zurück, wenn die Anfrage erfolgreich war.<br>
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist.<br>
	 * @param ctx Routing Context
	 */
	public void getUsers(RoutingContext ctx) {
		// Suchparameter aus dem RoutingContext extrahieren
		String username = ctx.request().params().get("username");

		StringBuilder sbSql = new StringBuilder(
			"SELECT ID, username, role FROM Users"
		);

		List<Object> params = new ArrayList<>();

		if (username != null && !username.trim().isEmpty()) {
			sbSql.append(" WHERE username LIKE CONCAT('%', ?, '%')");
			params.add(username);
		}

		jdbcPool.preparedQuery(sbSql.toString())
			.execute(Tuple.wrap(params), ar -> {
				if (ar.succeeded()) {
					JsonArray users = new JsonArray();
					RowSet<Row> rows = ar.result();
					for (Row row : rows) {
						JsonObject user = new JsonObject();
						user.put("id", row.getInteger("ID"));
						user.put("username", row.getString("username"));
						user.put("role", row.getString("role"));
						users.add(user);
					}
					MainVerticle.response(ctx.response(), 200, new JsonObject()
						.put("users", users)
					);
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Server- und/oder Datenbankfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * Entfernt alle Fotos des Benutzers und leitet die Anfrage an den nächsten Handler weiter.<br>
	 * Gibt Statuscode 500 mit Fehlermeldung zurück, wen ein Server - und/oder Datenbankfehler aufgetreten ist.<br>
	 */
	public void deleteAllPhotosFromUser(RoutingContext ctx) {
		System.out.println("called deleteAllPhotosFromUser in AdminHandler");

		Integer userID = Integer.parseInt(ctx.pathParam("userID"));
		jdbcPool.preparedQuery("DELETE FROM Photos WHERE Users_ID = ?")
			.execute(Tuple.of(userID), ar -> {
				if (ar.succeeded()) {
					ctx.next();
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Server- und/oder Datenbankfehler ist aufgetreten")
					);
				}
			});

	}

	/**
	 * Entfernt alle Alben des Benutzers und leitet die Anfrage an den nächsten Handler weiter.<br>
	 * Gibt Statuscode 500 mit Fehlermeldung zurück, wen ein Server - und/oder Datenbankfehler aufgetreten ist.<br>
	 */
	public void deleteAllAlbumsFromUser(RoutingContext ctx) {
		System.out.println("called deleteAllAlbumsFromUser in AdminHandler");

		Integer userID = Integer.parseInt(ctx.pathParam("userID"));
		jdbcPool.preparedQuery("DELETE FROM Albums WHERE Users_ID = ?")
			.execute(Tuple.of(userID), ar -> {
				if (ar.succeeded()) {
					ctx.next();
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "EIn interner Server- und/oder Datenbankfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * Prüft, ob die userID eine gültige Zahl ist und gibt ggf. Statuscode 400 zurück.<br>
	 */
	public void userIDIsNumber(RoutingContext ctx) {
		System.out.println("called userIDIsNumber in AdminHandler.java");
		try {
			Integer.parseInt(ctx.pathParam("userID"));
			ctx.next();
		} catch(NumberFormatException e) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "userID muss eine gültige Zahl sein")
			);
		}
	}

  /**
   * Fügt einen Nutzer zur Datenbak hinzu
   * Passwort wird mit Bcrypt gehashed
   * @param ctx
   */
  public void addUser(RoutingContext ctx) {
    String username = ctx.body().asJsonObject().getString("username");
    String password = ctx.body().asJsonObject().getString("password");

    String pwdHash = BCrypt.hashpw(password, BCrypt.gensalt(10));

    jdbcPool.preparedQuery("""
                       		          INSERT INTO Users
                                  (Username, Password)
                                  VALUES (?, ?)
                        			      """
    ).execute(Tuple.of(username, pwdHash), res -> {
      if (res.succeeded()) {
        String response = "Nutzer " + username + " erfolgreich angelegt";
        MainVerticle.response(ctx.response(), 201, new JsonObject()
          .put("message", response));

      } else {
        System.err.println("Error: " + res.cause().getMessage());
        MainVerticle.response(ctx.response(), 500, new JsonObject()
          .put("message", "Fehler beim erstellen des Nutzers")
        );
      }
    });
  }

	/**
	 * Prüft, ob versucht wird, den Admin zu löschen.<br>
	 * Wenn ja, gebe Statuscode 403 zurück<br>
	 * wenn nein, gebe die Anfrage an den nächsten Handler weiter.
	 * @param ctx
	 */
	public void tryToDelAdmin(RoutingContext ctx) {
		System.out.println("called tryToDelAdmin in AdminHandler.java");

		Integer userID = Integer.parseInt(ctx.pathParam("userID"));

		jdbcPool.preparedQuery("SELECT * FROM Users WHERE ID = ?")
			.execute(Tuple.of(userID), ar -> {
				if (ar.succeeded() && ar.result().size() > 0) {
					if (ar.result().iterator().next().getString("role").equals("ADMIN")) {
						MainVerticle.response(ctx.response(), 403, new JsonObject()
							.put("message", "Der Admin darf nicht gelöscht werden")
						);
					} else {
						ctx.next();
					}
				}  else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * Entfernt einen Benutzer und gibt bei Erfolg Statuscode 204 zurück.<br>
	 * Gibt Statuscode 500 mit Fehlermeldung zurück, wen ein Server - und/oder Datenbankfehler aufgetreten ist.<br>
	 * @param ctx
	 */
	public void delUser(RoutingContext ctx) {
		System.out.println("called delUser in AdminHandler.java");

		Integer userID = Integer.parseInt(ctx.pathParam("userID"));
		jdbcPool.preparedQuery("DELETE FROM Users WHERE ID = ?")
			.execute(Tuple.of(userID), ar -> {
				if (ar.succeeded()) {
					MainVerticle.response(ctx.response(), 204, new JsonObject()
						.put("message", "User wurde erfolgreich gelöscht")
					);
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Server- und/oder Datenbankfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * Prüft, ob der Nutzername bereits existiert und gibt ggf. Statuscode 409 zurück. Ansonsten rufe den nächsten Handler auf
	 */
	public void usernameIsUnique(RoutingContext ctx) {
		String username = ctx.body().asJsonObject().getString("username");
		jdbcPool.preparedQuery("SELECT * FROM Users WHERE username = ?")
			.execute(Tuple.of(username), ar -> {
				if (ar.succeeded() && ar.result().size() > 0) {
					MainVerticle.response(ctx.response(), 409, new JsonObject()
						.put("message", "Der Nutzername existiert bereits")
					);
				} else {
					ctx.next();
				}
			});
	}

	/**
	 * Ändert den Usernamen eines Benutzers<br>
	 * @param ctx
	 */
	public void handlePatchUsername(RoutingContext ctx) {
		System.out.println("called handlePatchUsername in AdminHandler.java");

		Integer userId = Integer.parseInt(ctx.pathParam("userID"));
		String username = ctx.body().asJsonObject().getString("username");

		jdbcPool.preparedQuery("UPDATE Users SET username = ? WHERE ID = ?")
			.execute(Tuple.of(username, userId), ar -> {
				if (ar.succeeded()) {
					MainVerticle.response(ctx.response(), 200, new JsonObject()
						.put("message", "Username erfolgreich geändert")
					);
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * Ändert das Passwort eines Benutzers.
	 * @param ctx
	 */
	public void handlerPatchPassword(RoutingContext ctx) {
		Integer userId = Integer.parseInt(ctx.pathParam("userID"));
		String password = ctx.body().asJsonObject().getString("password");

		String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt(10));

		jdbcPool.preparedQuery("UPDATE Users SET password = ? WHERE ID = ?")
			.execute(Tuple.of(hashedPassword, userId), ar -> {
				if (ar.succeeded()) {
					MainVerticle.response(ctx.response(), 200, new JsonObject()
						.put("message", "Passwort erfolgreich geändert")
					);
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Server- und/oder Datenbankfehler ist aufgetreten")
					);
				}
			});
	}

	/**
	 * @param userID Die userID des Benutzers
	 * @return Eine Liste mit den zugehörigen IDs der Fotos, die dem Benutze gehören
	 */
	Future<List<Integer>> getAllPhotosIDsFromUser(int userID) {
		Promise<List<Integer>> promise = Promise.promise();
		List<Integer> ids = new ArrayList<>();

		jdbcPool.preparedQuery("SELECT ID FROM Photos WHERE Users_ID = ?")
			.execute(Tuple.of(userID), ar -> {
				if (ar.succeeded()) {
					RowSet<Row> rows = ar.result();
					for (Row row : rows) {
						ids.add(row.getInteger("ID"));
					}
					promise.complete(ids);
				} else {
					promise.fail(ar.cause());
				}
			});

		return promise.future();
	}

	/**
	 *
	 * @param userID Die userID des Benutzers
	 * @return Eine Liste mit den zugehörigen IDs der Alben, die dem Benutzer gehören
	 */
	Future<List<Integer>> getAllAlbumsIDsFromUser(int userID) {
		Promise<List<Integer>> promise = Promise.promise();
		List<Integer> ids = new ArrayList<>();

		jdbcPool.preparedQuery("SELECT ID FROM Albums WHERE Users_ID = ?")
			.execute(Tuple.of(userID), ar -> {
				if (ar.succeeded()) {
					RowSet<Row> rows = ar.result();
					for (Row row : rows) {
						ids.add(row.getInteger("ID"));
					}
					promise.complete(ids);
				} else {
					promise.fail(ar.cause());
				}
			});
		return promise.future();
	}


	/**
	 * Löscht alle Tags aus der Verbindungstabelle, die dem Foto zugeordnet sind und gibt bei Erfolg die Anfrage an den nächsten Handler weiter.<br>
	 * Beendet bei Misserfolg die Anfrage mit Statuscode 500 und Fehlermeldung.
	 */
	public void deleteAllTagsFromUsersPhotos(RoutingContext ctx) {
		int userID = Integer.parseInt(ctx.pathParam("userID"));

		getAllPhotosIDsFromUser(userID).onComplete(ar -> {
			if (ar.succeeded()) {
				List<Integer> photoIDs = ar.result();
				List<Future<Void>> deleteFutures = new ArrayList<>();

				for (Integer photoID : photoIDs) {
					Promise<Void> deletePromise = Promise.promise();
					jdbcPool.preparedQuery("DELETE FROM PhotosTags WHERE Photos_ID = ?")
						.execute(Tuple.of(photoID), res -> {
							if (res.succeeded()) {
								deletePromise.complete();
							} else {
								deletePromise.fail(res.cause());
							}
						});
					deleteFutures.add(deletePromise.future());
				}

				Future.all(deleteFutures).onComplete(result -> {
					if (result.succeeded()) {
						ctx.next();
					} else {
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
	}

	/**
	 * Löscht alle Tags aus der Verbindungstabelle, die dem Album zugeordnet sind und gibt bei Erfolg die Anfrage an den nächsten Handler weiter.<br>
	 * Beendet bei Misserfolg die Anfrage mit Statuscode 500 und Fehlermeldung.
	 */
	public void deleteAllTagsFromUsersAlbums(RoutingContext ctx) {
		int userID = Integer.parseInt(ctx.pathParam("userID"));

		getAllAlbumsIDsFromUser(userID).onComplete(ar -> {
			if (ar.succeeded()) {
				List<Integer> albumsIDs = ar.result();
				List<Future<Void>> deleteFutures = new ArrayList<>();

				for (Integer albumID: albumsIDs) {
					Promise<Void> deletePromise = Promise.promise();
					jdbcPool.preparedQuery("DELETE FROM AlbumsTags WHERE Alben_ID = ?")
						.execute(Tuple.of(albumID), res -> {
							if (res.succeeded()) {
								deletePromise.complete();
							} else {
								deletePromise.fail(res.cause());
							}
						});
					deleteFutures.add(deletePromise.future());
				}

				Future.all(deleteFutures).onComplete(result -> {
					if (result.succeeded()) {
						ctx.next();
					} else {
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
	}

	/**
	 *
	 * Löscht aus der Verbindungstabelle AlbumsPhotos alle Verbindungen, die dem User gehören und gibt bei Erfolg an den nächsten Handler weiter<br>
	 * Bei Misserfolg wird die Anfrage beendet und Statuscode 500 mit Fehlermeldung zurückgegeben.
	 * @param ctx Der Routing Context
	 */
	public void deleteAllAlbumsFromUsersPhotos(RoutingContext ctx) {
		int userID = Integer.parseInt(ctx.pathParam("userID"));
		getAllPhotosIDsFromUser(userID).onComplete(ar -> {
			if (ar.succeeded()) {
				List<Integer> photosIDs = ar.result();
				List<Future<Void>> deleteFutures = new ArrayList<>();

				for (Integer photoID: photosIDs) {
					Promise<Void> deletePromise = Promise.promise();
					jdbcPool.preparedQuery("DELETE FROM AlbumsPhotos WHERE Photos_ID = ?")
						.execute(Tuple.of(photoID), res -> {
							if (res.succeeded()) {
								deletePromise.complete();
							} else {
								deletePromise.fail(res.cause());
							}
						});
					deleteFutures.add(deletePromise.future());
				}

				Future.all(deleteFutures).onComplete(result -> {
					if (result.succeeded()) {
						ctx.next();
					} else {
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
	}
}

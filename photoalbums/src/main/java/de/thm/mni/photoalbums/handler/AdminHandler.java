package de.thm.mni.photoalbums.handler;

import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.core.MultiMap;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;

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
  public void addUser(RoutingContext ctx) {
    String username = ctx.body().asJsonObject().getString("username")
    String password = ctx.body().asJsonObject().getString("password");
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
}

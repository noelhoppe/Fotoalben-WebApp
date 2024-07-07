package de.thm.mni.photoalbums.handler;

import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.core.http.HttpServerResponse;
import io.vertx.core.json.Json;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;
import org.mindrot.jbcrypt.BCrypt;

public class LoginHandler {
	private JDBCPool jdbcPool;
	private String SESSION_ATTRIBUTE_USER;
	private String SESSION_ATTRIBUTE_ROLE;

	public LoginHandler(JDBCPool jdbcPool, String sessionAttributeUser, String sessionAttributeRole) {
		this.SESSION_ATTRIBUTE_USER = sessionAttributeUser;
		this.SESSION_ATTRIBUTE_ROLE = sessionAttributeRole;
		this.jdbcPool = jdbcPool;
	}

	// TODO: Sollte ich ein Statuscode 3xx zurückgeben bei erfolgreichen Login
	/**
	 * Extrahiert das JsonObject user aus dem RoutingContext und selektiert die Felder username und password des user Objekts.
	 * Gibt Statuscode 400 mit entsprechender JSON message zurück,
	 * wenn der Benutzername oder das Password Leerzeichen enthält,
	 * der Benutzernamen oder das Password null oder leer ist oder
	 * der Benutzername oder das Passwort falsch ist.
	 * Gibt Statuscode 500 mit entsprechender JSON message zurück, wenn ein Server- oder Datenbankfehler aufgetreten ist.
	 * Gibt Statuscode 200 mit entsprechender JSPON message zurück, wenn der Login erfolgreich war, also wenn das Paar Benutzername und Passwort existiert
	 * @param ctx Routing Context
	 */
	public void handleLogin(RoutingContext ctx) {
		JsonObject user = ctx.body().asJsonObject().getJsonObject("user");
		String username = user.getString("username");
		String password = user.getString("password");

		if (username.contains(" ")) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Username darf keine Leerzeichen enthalten")
			);
		}

		if (password.contains(" ")) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Das Passwort darf keine Leerzeichen enthalten")
			);
		}

		if (username == null || username.trim().isEmpty()) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Nutzername darf nicht leer sein")
			);
		}

		if (password == null || password.trim().isEmpty()) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Das Passwort darf nicht leer sein")
			);
		}

		// Execute SQL query to retrieve user from database
		jdbcPool.preparedQuery("SELECT * FROM Users WHERE Users.username = ?")
			.execute(Tuple.of(username), ar -> {
				if (ar.succeeded()) {
					RowSet<Row> rows = ar.result();
					if (rows.size() == 1) {
						Row row = rows.iterator().next();
						String storedPasswordHash = row.getString("password");
						String role = row.getString("role");
						if (BCrypt.checkpw(password, storedPasswordHash)) {
							System.out.println("Login erfolgreich");
							ctx.session()
								.put(SESSION_ATTRIBUTE_USER, username)
								.put(SESSION_ATTRIBUTE_ROLE, role);
							ctx.response()
								.setStatusCode(303)
								.putHeader("Location", "/photoalbums.html")
								.end();
							/*
							MainVerticle.response(ctx.response(), 200, new JsonObject()
								.put("message", "Login erfolgreich")
								.put("sessionID", ctx.session().id())
								.put("user", new JsonObject()
									.put("username", username)
									.put("role", role)
								));
							 */

						} else { // Passwort falsch
							System.out.println("Login nicht erfolgreich");
							MainVerticle.response(ctx.response(), 400, new JsonObject().put("message", "Nutzername oder Passwort falsch"));
						}
					} else {
						MainVerticle.response(ctx.response(), 400, new JsonObject().put("message", "Nutzername oder Passwort falsch"));
					}
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject().put("message", "Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut."));
				}
			});
	}
}

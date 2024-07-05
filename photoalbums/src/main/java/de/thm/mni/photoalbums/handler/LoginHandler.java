package de.thm.mni.photoalbums.handler;

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


	public void handleLogin(RoutingContext ctx) {
		JsonObject user = ctx.body().asJsonObject().getJsonObject("user");
		String username = user.getString("username");
		String password = user.getString("password");

		if (username.contains(" ")) {
			response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Username darf keine Leerzeichen enthalten")
			);
		}

		if (password.contains(" ")) {
			response(ctx.response(), 400, new JsonObject()
				.put("message", "Das Passwort darf keine Leerzeichen enthalten")
			);
		}

		if (username == null || username.trim().isEmpty()) {
			response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Nutzername darf nicht leer sein")
			);
		}

		if (password == null || password.trim().isEmpty()) {
			response(ctx.response(), 400, new JsonObject()
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

							response(ctx.response(), 200, new JsonObject()
								.put("message", "Login erfolgreich")
								.put("sessionID", ctx.session().id())
								.put("user", new JsonObject()
									.put("username", username)
									.put("role", role)
								)
							);
						} else { // Passwort falsch
							System.out.println("Login nicht erfolgreich");
							response(ctx.response(), 400, new JsonObject().put("message", "Nutzername oder Passwort falsch"));
						}
					} else {
						response(ctx.response(), 400, new JsonObject().put("message", "Nutzername oder Passwort falsch"));
					}
				} else {
					response(ctx.response(), 500, new JsonObject().put("message", "Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut."));
				}
			});



	}

	private void response(HttpServerResponse response, Integer statusCode, JsonObject json) {
		response
			.putHeader("content-type", "application/json")
			.setStatusCode(statusCode)
			.end(Json.encodePrettily(json));
	}
}







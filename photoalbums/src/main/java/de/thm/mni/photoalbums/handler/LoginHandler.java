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
	final private JDBCPool jdbcPool;

	public LoginHandler(JDBCPool jdbcPool) {
		this.jdbcPool = jdbcPool;
	}

	/**
	 * Selektiert die Felder username und password aus dem RoutingContext. <br>
	 * Gibt Statuscode 500 mit entsprechender JSON message zurück, wenn die Anfrage falsch formatiert ist oder der username oder das password null ist und beendet die http Anfrage im Anschluss. <br>
	 * Ansonsten wird der nächste Handler aufgerufen.<br>
	 * @param ctx Routing Context
	 */
	public void grabData(RoutingContext ctx) {
		System.out.println("called grabData in LoginHandler.java");
		try {
			String username = ctx.body().asJsonObject().getString("username");
			String password = ctx.body().asJsonObject().getString("password");

			if (username == null || password == null) {
				throw new IllegalArgumentException();
			}

			ctx.put("username", username);
			ctx.put("password", password);
			ctx.next();
		} catch(IllegalArgumentException iae) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Die Anfrage muss folgendes Format haben und die keys username und password sind nicht null-Werte")
				.put("username", "___")
				.put("password", "___")
			);
		}
	}

	/**
	 * Gibt Statuscode 400 mit entsprechender Fehlermeldung zurück, wenn das Feld username leer ist oder Leerzeichen enthält und beendet die http-Anfrage. <br>
	 * Ansonsten wird der nächste Handler aufgerufen. <br>
	 * @param ctx Routing Context
	 */
	public void validateUsernameInput(RoutingContext ctx) {
		System.out.println("called validateUsernameInput in LoginHandler.java");
		if (ctx.data().get("username").toString().contains(" ")) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Nutzername darf keine Leerzeichen enthalten")
			);
		}
		else if (ctx.data().get("username").toString().trim().isEmpty()) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Der Nutzername darf nicht leer sein")
			);
		}
    else if (ctx.data().get("username").toString().length() > 30) {
        MainVerticle.response(ctx.response(), 400, new JsonObject()
          .put("message", "Der Nutzername darf höchstens 30 Zeichen lang sein")
        );
    }
		else {
			ctx.next();
		}
	}

	/**
	 * Gibt Statuscode 400 mit entsprechender Fehlermeldung zurück, wenn das Feld password leer ist oder Leerzeichen enthält und beendet die http-Anfrage. <br>
	 * Ansonsten wird der nächste Handler aufgerufen. <br>
	 * @param ctx Routing Context
	 */
	public void validatePasswordInput(RoutingContext ctx) {
		System.out.println("called validatePasswordInput in LoginHandler.java");
		if (ctx.data().get("password").toString().contains(" ")) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Das Passwort darf keine Leerzeichen enthalten")
			);
		} else if (ctx.data().get("password").toString().trim().isEmpty()) {
			MainVerticle.response(ctx.response(), 400, new JsonObject()
				.put("message", "Das Passwort darf nicht leer sein")
			);
		} else if (ctx.data().get("password").toString().length() <4 || ctx.data().get("password").toString().length() > 30){
        		MainVerticle.response(ctx.response(), 400, new JsonObject()
          			.put("message", "Das Passwort muss zwischen 4 und 30 Zeichen lang sein")
        		);
      		} else {
			ctx.next();
		}
	}

	/**
	 * Gibt Statuscode 400 mit entsprechender Fehlermeldung zurück, wenn das Paar username und password nicht existiert und beendet die Anfrage. <br>
	 * Gibt Statuscode 303 mit entsprechendem Location-Header zurück, wenn der Login erfolgreich war. <br>
	 * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist. <br>
	 * @param ctx Routing Context
	 */
	public void checkUsernamePasswordPair(RoutingContext ctx) {
		System.out.println("called checkUsernamePasswordPair in LoginHandler.java");
		String username = ctx.data().get("username").toString();
		String password = ctx.data().get("password").toString();

		jdbcPool.preparedQuery("SELECT * FROM Users WHERE Users.username = ?")
			.execute(Tuple.of(username), ar -> {
				if (ar.succeeded()) {
					RowSet<Row> rows = ar.result();
					if (rows.size() == 1) {
						Row row = rows.iterator().next();
						String storedPasswordHash = row.getString("password");
						String role = row.getString("role");
						Integer id = row.getInteger("ID");
						if (BCrypt.checkpw(password, storedPasswordHash)) {
							ctx.session()
								.put(MainVerticle.SESSION_ATTRIBUTE_ID, id)
								.put(MainVerticle.SESSION_ATTRIBUTE_USER, username)
								.put(MainVerticle.SESSION_ATTRIBUTE_ROLE, role);
							ctx.response()
								.setStatusCode(303)
								.putHeader("Location", "/protected/photoalbums.html")
								.end();
						} else { // Passwort falsch
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

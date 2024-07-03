package de.thm.mni.photoalbums.handler;

import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.Session;
import io.vertx.jdbcclient.JDBCPool;
import org.mindrot.jbcrypt.BCrypt;

public class LoginHandler {

	private JDBCPool jdbcPool;

	public LoginHandler(JDBCPool jdbcPool) { this.jdbcPool = jdbcPool; }

	public void handleLogin(RoutingContext ctx) {
		JsonObject user = ctx.body().asJsonObject().getJsonObject("user");
		String username = user.getString("username");
		Integer password = user.getInteger("password");

		if (username == null ||username.isEmpty()) {
			ctx.response()
				.setStatusCode(400)
				.putHeader("content-type", "application/json")
				.end(new JsonObject()
					.put("message", "Der Nutzername darf nicht leer sein")
					.encode()
				);
			// TODO: return?
		}

		if (password == null || password.toString().isEmpty()) {
			ctx.response()
				.setStatusCode(400)
				.putHeader("content-type", "application/json")
				.end(new JsonObject()
					.put("message", "Das Passwort darf nicht leer sein")
					.encode()
				);
		}

		if (ctx.session())
	}

	boolean isAuthenticated(String username, String password) {

	}
}

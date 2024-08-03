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
			sbSql.append(" WHERE username = ?");
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

  public void addUser(RoutingContext ctx) {
    String username = ctx.body().asJsonObject().getString("username")
    String password = ctx.body().asJsonObject().getString("password");
  }

}

package de.thm.mni.photoalbums;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.SqlConnection;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseVerticle extends AbstractVerticle {
	JDBCPool jdbcPool;

	// Event Buss Adressen (public, static und final, Namenskonvention)
	public static final String LIST_ALL_USERS_ADDR = "de.thm.mni.photoalbums.list_all_users";

	// SQL Queries (private, final, Namenskonvention)
	private final String LIST_ALL_USERS = "SELECT * FROM users";

	@Override
	public void start(Promise<Void> startPromise) throws Exception {
		configureSqlClient()
			.compose(this::configureEventBusConsumers)
			.onComplete(startPromise);
	}

	Future<Void> configureSqlClient() {
		JsonObject database = config().getJsonObject("database");
		this.jdbcPool = JDBCPool.pool(vertx, database);

		return Future.succeededFuture();
	}

	Future<Void> configureEventBusConsumers(Void unused) {
		vertx.eventBus().consumer(LIST_ALL_USERS_ADDR).handler(this::listAllUsers);
		return Future.succeededFuture();
	}

	void listAllUsers(Message<Object> message) {
		jdbcPool.query(LIST_ALL_USERS)
			.execute()
			.onSuccess(rows -> {
				JsonArray result = new JsonArray();
				for (Row row : rows) {
					JsonObject user = new JsonObject()
						.put("ID", row.getInteger("ID"))
						.put("username", row.getString("username"))
						.put("role", row.getString("role"));
					result.add(user);
				}
				message.reply(result); // Senden der Antwort zurück an den Absender der Nachricht
			})
			.onFailure(err -> {
				message.fail(500, err.getMessage()); // Fehlerbehandlung
			});
	}
}

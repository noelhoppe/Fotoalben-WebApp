package de.thm.mni.photoalbums;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.SqlConnection;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseVerticle extends AbstractVerticle {
	private Connection connection;

	@Override
	public void start(Promise<Void> startPromise) throws Exception {
		connectToDatabase();
	}

	void connectToDatabase() {
		JsonObject database = config().getJsonObject("database");
		String url = database.getString("url");
		String user = database.getString("user");
		String password = database.getString("password");
		try(Connection connection = DriverManager.getConnection(url, user, password)) {
			this.connection = connection;
		} catch(SQLException sqlException) {
			sqlException.printStackTrace();
		}
	}



}

package de.thm.mni.photoalbums.handler;

import com.sun.tools.javac.Main;
import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.Session;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PhotoHandler {
	private static final Logger log = LoggerFactory.getLogger(PhotoHandler.class);
	JDBCPool jdbcPool;

	public PhotoHandler(JDBCPool jdbcPool) {
		this.jdbcPool = jdbcPool;
	}

	public void getAllPhotosFromUser(RoutingContext ctx) {
		Integer userIdStr = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);

		jdbcPool.preparedQuery("SELECT * FROM Photos WHERE Users_ID = ?")
			.execute(Tuple.of(userIdStr), res -> {
				if (res.succeeded()) {
					RowSet<Row> rows = res.result();
					JsonArray photos = new JsonArray();
					for (Row row : rows) {
						JsonObject photo = new JsonObject();
						photo.put("title", row.getString("title"));
						photo.put("taken", row.getLocalDate("taken").toString()); // FIXME: Mapping von date typ in sql zu java, typescript, javascript
						photo.put("url", row.getString("url"));
						photos.add(photo);
					}
					MainVerticle.response(ctx.response(), 200, new JsonObject().put("photos", photos));
				} else {
					MainVerticle.response(ctx.response(), 500, new JsonObject()
						.put("message", "Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut")
					);
				}
			});
	}


}

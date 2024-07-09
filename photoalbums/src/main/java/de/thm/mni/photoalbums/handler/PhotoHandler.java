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
	JDBCPool jdbcPool;

	public PhotoHandler(JDBCPool jdbcPool) {
		this.jdbcPool = jdbcPool;
	}

	/**
	 * Ein Nutzer fragt seine gesamten Fotos an.
	 * Selektiert alle Felder der Tabelle Photos, wo Photos.Users_ID der user id des Session Objektes entspricht.
	 * @param ctx Routing Context
	 */
	public void getAllPhotosFromUser(RoutingContext ctx) {
		Integer userIdStr = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);

		jdbcPool.preparedQuery("""
				SELECT p.ID, p.title, p.taken, p.url, GROUP_CONCAT(t.name SEPARATOR ', ') as tags
    				FROM Photos p
    				LEFT JOIN PhotosTags pt
        					ON pt.Photos_ID = p.ID
    				LEFT JOIN Tags t
        					ON pt.TAGS_ID = t.ID
    				WHERE p.Users_ID = ?
    				GROUP BY p.ID, p.title, p.taken, p.url
				""")
			.execute(Tuple.of(userIdStr), res -> {
				if (res.succeeded()) {
					RowSet<Row> rows = res.result();
					JsonArray photos = new JsonArray();
					for (Row row : rows) {
						JsonObject photo = new JsonObject();
						photo.put("id", row.getLong("ID"));
						photo.put("title", row.getString("title"));
						photo.put("taken", row.getLocalDate("taken").toString());
						photo.put("url", row.getString("url"));
						photo.put("tags", row.getString("tags"));
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

	/**
	 * Sendet das Bild und prüft, ob der Nutzer das Bild anfragen darf.
	 * http://localhost:8080/img/1.jpg wird verhindert für nicht angemeldeten Benutzer
	 *
	 * @param ctx Routing Context
	 */
	public void servePhotos(RoutingContext ctx) {
		String imageId = ctx.pathParam("imageId");
		Integer userId = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);
		// System.out.println("userId: " + userId);
		// System.out.println("imageId: " + imageId);

		// Überprüfung der userId auf null
		if (userId == null) {
			MainVerticle.response(ctx.response(), 403, new JsonObject()
				.put("message", "Unautorisierter Zugriff auf das Bild")
			);
			return;
		}

		jdbcPool.preparedQuery("SELECT url FROM Photos WHERE url = ? AND Users_ID = ?")
			.execute(Tuple.of(imageId, userId), res -> {
				if (res.succeeded() && res.result().size() > 0) {
					String imagePath = "img/" + imageId;
					ctx.response().sendFile(imagePath).onFailure(err -> {
						MainVerticle.response(ctx.response(), 500, new JsonObject()
							.put("message", "Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut")
						);
					});
				} else {
					MainVerticle.response(ctx.response(), 403, new JsonObject()
						.put("message", "Unautorisierter Zugriff auf das Bild")
					);
				}
			});
	}

	/*
	public void deleteTag(RoutingContext ctx) {
		String tagName = ctx.body().asJsonObject().getString("tagName");
		jdbcPool.preparedQuery("")
	}

	 */


}

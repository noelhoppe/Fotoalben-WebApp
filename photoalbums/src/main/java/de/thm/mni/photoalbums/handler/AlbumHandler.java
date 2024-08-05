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

public class AlbumHandler {

  private final JDBCPool jdbcPool;

  public AlbumHandler(JDBCPool jdbcPool) {
    this.jdbcPool = jdbcPool;
  }

  /**
   * Handler für GET /albums <br>
   * Gibt Statuscode 200 und JSON mit allen Alben-Informationen inklusive Tags als kommaseparierter String zurück.<br>
   * Gibt Statuscode 500 mit entsprechender Fehlermeldung zurück, wenn ein Server- und/oder Datenbankfehler aufgetreten ist. <br>
   * @param ctx Routing Context
   */
  public void getAllAlbumsFromUser(RoutingContext ctx) {

    // Get userId from session
    Integer userIdStr = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);
    System.out.println(userIdStr);

    // Get query parameters
    String searchParam = ctx.request().params().get("searchParam");


    // Build the SQL query
    StringBuilder sql = new StringBuilder("""
                      SELECT a.ID, a.title, GROUP_CONCAT(t.name SEPARATOR ', ') as tags
                      FROM Albums a
                      LEFT JOIN AlbumsTags at
                                ON at.Alben_ID = a.ID
                      LEFT JOIN Tags t
                                 ON at.TAGS_ID = t.ID
                     WHERE a.ID IN (
                     SELECT a_inner.ID
                                FROM Albums a_inner
                                LEFT JOIN AlbumsTags at_inner
                                       ON at_inner.Alben_ID = a_inner.ID
                                LEFT JOIN Tags t_inner
                                       ON at_inner.TAGS_ID = t_inner.ID
                                WHERE a_inner.Users_ID = ?
                  """);

    List<Object> params = new ArrayList<>();
    params.add(userIdStr);

    if (searchParam != null && !searchParam.trim().isEmpty()) {
      sql.append("AND t_inner.name LIKE CONCAT('%', ?, '%') OR a_inner.title LIKE CONCAT('%', ?, '%')");
      params.add(searchParam);
      params.add(searchParam);
    }

    sql.append("""
                                 GROUP BY a_inner.ID
                      )
                      GROUP BY a.ID, a.title
                  """);


    jdbcPool.preparedQuery(sql.toString())
           .execute(Tuple.from(params), res -> {
             if (res.succeeded()) {
               RowSet<Row> rows = res.result();
               JsonArray albums = new JsonArray();
               for (Row row : rows) {
                 JsonObject album = new JsonObject();
                 album.put("id", row.getLong("ID"));
                 album.put("title", row.getString("title"));
                 album.put("tags", row.getString("tags"));
                 albums.add(album);
               }
               MainVerticle.response(ctx.response(), 200, new JsonObject().put("albums", albums));
             } else {
               MainVerticle.response(ctx.response(), 500, new JsonObject()
                      .put("message", "Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut")
               );
             }
           });
  }

  /**
   * Prüft, ob der Albumtitel nur aus Leerzeichen besteht, also leer ist. <br>
   * Prüft ob der Albumtitel länger als 30 Zeichen ist. <br>
   * Wenn ja, gebe Statuscode 400 mit entsprechender Fehlermeldung zurück. <br>
   * Wenn nein, gebe die Anfrage an den nächsten Handler weiter <br>
   * @param ctx Routing Context
   */
  public void validateAlbumTitleReq(RoutingContext ctx) {
    String albumTitle = ctx.data().get("title").toString();

    if (albumTitle.trim().isEmpty()) {
      MainVerticle.response(ctx.response(), 400, new JsonObject()
        .put("message", "Der Titel darf nicht leer sein")
      );
    } else if (albumTitle.length() > 30) {
      MainVerticle.response(ctx.response(), 400, new JsonObject()
        .put("message", "Der Titel darf maximal 30 Zeichen lang sein")
      );
    } else {
      ctx.next();
    }
  }

  /**
   * Handler für POST /albums <br>
   * Erstellt ein Album mit dem im RoutingContext hinterlegten title <br>
   * Gibt Statuscode 201 zurück wenn erfolgreich <br>
   * Gibt Statuscode 500 mit entprechender Meldung zurück wenn ein Server- oder Datenbankfehler auftritt <br>
   * @param ctx
   */
  public void createAlbum(RoutingContext ctx){

    int currentUserID = ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ID);
    String title = ctx.data().get("title").toString();

    jdbcPool.preparedQuery("""
                                INSERT INTO Albums
                                (Users_ID, title)
                                VALUES (?, ?)
                                """)
      .execute(Tuple.of(currentUserID, title), res -> {
        if (res.succeeded()) {
          MainVerticle.response(ctx.response(), 201, new JsonObject()
            .put("message", "ALbum erfolgreich angelegt!")
          );
        } else {
          System.err.println(res.cause().getMessage());
          MainVerticle.response(ctx.response(), 500, new JsonObject()
            .put("message", "Fehler beim erstellen des Albums")
          );
        }
      });
  }

  /**
   * Wenn ein Album gelöscht wird, werden alle Fotos des Albums aus der Verbindungstabelle gelöscht und der nächste Handler wird aufgerufen<br>
   * Gebe Statuscode 500 mit Fehlermeldung zurück, wenn ein Server - und/oder Datenbankfehler aufgetreten ist<br>
   */
  public void deleteAlbumsPhotosConnections(RoutingContext ctx) {
    String albumID = ctx.pathParam("albumID");
    jdbcPool.preparedQuery("DELETE FROM AlbumsPhotos WHERE Albums_ID = ?")
           .execute(Tuple.of(albumID), res -> {
             if (res.succeeded()) {
               ctx.next();
             } else {
               MainVerticle.response(ctx.response(), 500, new JsonObject()
                      .put("message", "Ein interner Serverfehler ist aufgetreten.")
               );
             }
           });
  }

  /**
   * Wenn ein Album gelöscht wird, werden alle Tags des Albums aus der Verbindungstabelle gelöscht und der nächste Handler wird aufgerufen<br>
   * Gebe Statuscode 500 mit Fehlermeldung zurück, wenn ein Server - und/oder Datenbankfehler aufgetreten ist<br>
   */
  public void deleteAlbumsTagsConnections(RoutingContext ctx) {
    String albumID = ctx.pathParam("albumID");
    jdbcPool.preparedQuery("DELETE FROM AlbumsTags WHERE Alben_ID = ?")
           .execute(Tuple.of(albumID), res -> {
             if (res.succeeded()) {
               ctx.next();
             } else {
               MainVerticle.response(ctx.response(), 500, new JsonObject()
                      .put("message", "Ein interner Serverfehler ist aufgetreten.")
               );
             }
           });
  }

  /**
   * Lösche dsa entsprechende Album <br>
   * Gebe Statuscode 500 mit Fehlermeldung zurück, wenn ein Server - und/oder Datenbankfehler aufgetreten ist<br>
   */
  public void deleteFromAlbums(RoutingContext ctx) {
    String albumID = ctx.pathParam("albumID");
    jdbcPool.preparedQuery("DELETE FROM Albums WHERE ID = ?")
           .execute(Tuple.of(albumID), res -> {
             if (res.succeeded()) {
               ctx.response()
                      .setStatusCode(204)
                      .end();
             } else {
               MainVerticle.response(ctx.response(), 500, new JsonObject()
                      .put("message", "Ein interner Serverfehler ist aufgetreten.")
               );
             }
           });
  }
}

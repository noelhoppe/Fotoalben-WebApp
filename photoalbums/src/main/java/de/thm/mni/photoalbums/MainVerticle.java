package de.thm.mni.photoalbums;
import de.thm.mni.photoalbums.handler.AuthenticationHandler;
import de.thm.mni.photoalbums.handler.LoginHandler;
import de.thm.mni.photoalbums.handler.PhotoHandler;
import io.vertx.config.ConfigRetriever;
import io.vertx.config.ConfigRetrieverOptions;
import io.vertx.config.ConfigStoreOptions;
import io.vertx.core.*;
import io.vertx.core.file.FileSystem;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerResponse;
import io.vertx.core.json.Json;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.*;
import io.vertx.ext.web.sstore.LocalSessionStore;
import io.vertx.jdbcclient.JDBCPool;

/**
 * Die MainVerticle-Klasse ist der Haupteinstiegspunkt für die Vert.x-Anwendung.
 * Sie konfiguriert die Anwendung, indem sie Konfigurationen aus einer Konfigurationsdatei liest,
 * initialisiert einen JDBC Pool und stellt einen HTTP Server bereit, der Anfragen über ein Router-Objekt verarbeitet.
 */
public class MainVerticle extends AbstractVerticle {
  public static final String SESSION_ATTRIBUTE_USER = "user";
  public static final String SESSION_ATTRIBUTE_ROLE = "role";
  public static final String SESSION_ATTRIBUTE_ID = "id";

  private JsonObject config;
  private JDBCPool jdbcPool;

  /**
   * List Konfigurationen aus einer Konfigurationsdatei, speichert diese in einem privaten Feld der Klasse,
   * initialisiert einen JDBC Pool und stellt einen HTTP Server bereit, der Anfragen über ein Router-Objekt verarbeitet.
   *
   * @param startPromise ein Promise, das anzeigt, ob der Startvorgang erfolgreich oder fehlerhaft war.
   */
  @Override
  public void start(Promise<Void> startPromise) throws Exception {
    doConfig()
              .compose(this::storeConfig)
              .compose(this::configureSqlClient)
              .compose(this::configureRouter)
              .compose(this::startHttpServer)
              .onComplete(ar -> {
                if (ar.succeeded()) {
                  System.out.println("Main verticle started successfully. Http Server started on http://localhost:8080.");
                  startPromise.complete();
                } else {
                  ar.cause().printStackTrace();
                  startPromise.fail(ar.cause());
                }
              });
  }

  /**
   * Liest die Konfiguration aus einer JSON-Datei aus.
   *
   * <p>Diese Methode richtet einen Konfigurationsspeicher ein, der aus einer Datei
   * "config.json" liest. Sie erstellt
   * dann einen Konfigurationsabruf mit diesem Speicher und gibt ein Future zurück,
   * das mit der Konfiguration als {@link JsonObject} abgeschlossen wird.
   *
   * @return Ein {@link Future}, das mit der Konfiguration als {@link JsonObject} abgeschlossen wird
   */
  Future<JsonObject> doConfig() {
    ConfigStoreOptions defaultConfig = new ConfigStoreOptions()
              .setType("file")
              .setConfig(new JsonObject().put("path", "config.json"));

    ConfigRetrieverOptions opts = new ConfigRetrieverOptions()
              .addStore(defaultConfig);

    ConfigRetriever retriever = ConfigRetriever.create(vertx, opts);

    return Future.future(promise -> retriever.getConfig(promise));
  }

  /**
   * Speichert die Konfiguration, die vom Konfigurationsabruf erhalten wurde.
   *
   * @param config die zu speichernde Konfiguration
   * @return Ein {@link Future}, das den Erfolg oder Misserfolg der Speicheroperation anzeigt
   */
  Future<Void> storeConfig(JsonObject config) {
    this.config = config;
    return Future.succeededFuture();
  }

  /**
   * Konfiguriert den JDBC-Client mit den in der Konfiguration angegebenen Datenbankinformationen.
   *
   * @param unused nicht verwendeter Parameter
   * @return Ein {@link Future}, das den Erfolg oder Misserfolg der Konfiguration des JDBC-Clients anzeigt
   */
  Future<Void> configureSqlClient(Void unused) {
    JsonObject database =  config.getJsonObject("database");

    this.jdbcPool = JDBCPool.pool(vertx, database);

    return Future.succeededFuture();
  }

  /**
   * Konfiguriert den Router für die HTTP-Anfragen.
   *
   * @param unused nicht verwendeter Parameter
   * @return Ein {@link Future}, das den konfigurierten Router zurückgibt
   */
  Future<Router> configureRouter(Void unused) {
    Router router = Router.router(vertx);

    // Body-Handler, um body des http-req zu parsen und an den RoutingContext weiterzugeben
    router.route(HttpMethod.POST, "/photos").handler(BodyHandler.create().setUploadsDirectory("img")); //BodyHandler für Photoupload
    router.route().handler(BodyHandler.create());

    // --- REQUEST LOGGING ---
    router.route().handler(LoggerHandler.create());
    // --- REQUEST LOGGING ---



    // --- SESSION HANDLER ---
    router.route().handler(SessionHandler.create(
              LocalSessionStore.create(vertx)
    ));
    //  --- SESSION HANDLER ---



    AuthenticationHandler authenticationHandler = new AuthenticationHandler();



    // --- STATIC HANDLER ---
    // admin.html kann nur vom admin aufgerufen werden
    router.get("/protected/admin.html")
           .handler(authenticationHandler::isLoggedIn)
           .handler(authenticationHandler::isAdmin)
           .handler(StaticHandler.create(FileSystemAccess.RELATIVE, "views/protected")
                  .setCachingEnabled(false)
           );

    // photoalbums.html kann nur von eingeloggten Benutzern aufgerufen werden
    router.get("/protected/photoalbums.html")
           .handler(authenticationHandler::isLoggedIn)
           .handler(StaticHandler.create(FileSystemAccess.RELATIVE, "views/protected")
                  .setCachingEnabled(false)
    );

    // Static Handler, um login.html OHNE AUTHENTIFIZIERUNG auszuliefern
    router.get()
           .handler(StaticHandler.create(FileSystemAccess.RELATIVE, "views")
                  .setCachingEnabled(false)
                  .setIndexPage("login.html")
    );

    // Static Handler, um *.js OHNE AUTHENTIFIZIERUNG auszuliefern
    router.get().handler(StaticHandler.create(FileSystemAccess.RELATIVE, "js-build")
           .setCachingEnabled(false)
    );
    // --- STATIC HANDLER ---



    // --- LOGIN ---
    LoginHandler loginHandler = new LoginHandler(jdbcPool);
    router.post("/login")
           .handler(loginHandler::grabData)
           .handler(loginHandler::validateUsernameInput)
           .handler(loginHandler::validatePasswordInput)
           .handler(loginHandler::checkUsernamePasswordPair);

    router.get( "/username").handler(authenticationHandler::isLoggedIn).handler(ctx -> {
      MainVerticle.response(ctx.response(), 200, new JsonObject()
             .put("username", ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_USER))
      );
    });

    router.get("/role").handler(authenticationHandler::isLoggedIn).handler(ctx -> {
      MainVerticle.response(ctx.response(), 200, new JsonObject()
             .put("role", ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ROLE))
      );
    });
    // --- LOGIN ---



    // -- LOGOUT ---
    router.post("/logout").handler(ctx -> {
      if (ctx.session().isEmpty()) {
        MainVerticle.response(ctx.response(), 500, new JsonObject().put("message", "Die Session ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an"));
      } else {
        ctx.session().destroy();
        ctx.response()
                  .setStatusCode(303)
                  .putHeader("Location", "/login.html")
                  .end();
      }
    });
    // --- LOGOUT ---



    // -- PHOTO HANDLER ---
    PhotoHandler photoHandler = new PhotoHandler(jdbcPool);
    router.get("/photos")
           .handler(authenticationHandler::isLoggedIn)
           .handler(photoHandler::getAllPhotosFromUser);

    router.get("/img/:photoID")
           .handler(authenticationHandler::isLoggedIn)
           .handler(ctx -> {
             ctx.data().put("photoID", ctx.pathParam("photoID"));
             ctx.next();
           })
           .handler(photoHandler::validatePhotoInputReq)
           .handler(photoHandler::photoExits)
           .handler(photoHandler::photoIsUser)
           .handler(photoHandler::servePhotos);

    router.delete("/tag")
           .handler(authenticationHandler::isLoggedIn)
           .handler(ctx -> {
             ctx.data().put("photoID", ctx.body().asJsonObject().getString("photoID"));
             ctx.data().put("tag", ctx.body().asJsonObject().getString("tag"));
             ctx.next();
           })
           .handler(photoHandler::validatePhotoInputReq)
           .handler(photoHandler::validateTagInputReq)
           .handler(photoHandler::photoExits)
           .handler(photoHandler::photoIsUser)
           .handler(photoHandler::deleteTag);

    router.post("/tag") .handler(authenticationHandler::isLoggedIn).handler(photoHandler::addTagToPhoto);

    router.patch( "/photoTitle").handler(authenticationHandler::isLoggedIn).handler(photoHandler::editPhotoTitle);

    router.post("/photos").handler(photoHandler::uploadPhoto);

    // router.route(HttpMethod.PATCH, "/photoData").handler(authenticationHandler::authenticate).handler(photoHandler::handleEditPhotoDate)


    return Future.succeededFuture(router);
  }

  /**
   * Startet den HTTP-Server mit dem konfigurierten Router.
   *
   * @param router der konfigurierte Router, der dem Server übergeben wird
   * @return Ein {@link Future}, das den Erfolg oder Misserfolg des Startvorgangs des HTTP-Servers anzeigt
   */
  Future<Void> startHttpServer(Router router) {
    JsonObject http = config.getJsonObject("http");
    int httpPort = http.getInteger("port");

    HttpServer server = vertx.createHttpServer().requestHandler(router);

    return Future.<HttpServer>future(promise -> server.listen(httpPort, promise)).mapEmpty();
  }

  /**
   * Hilfsmethode, um Response Overhead zu minimieren.
   *
   * @param response Instanz der Antwort des Servers
   * @param statusCode Statuscode der Anfrage
   * @param json JSON Antwort des Servers
   */
  public static void response(HttpServerResponse response, Integer statusCode, JsonObject json) {
    response
              .putHeader("content-type", "application/json")
              .setStatusCode(statusCode)
              .end(Json.encodePrettily(json));
  }
}

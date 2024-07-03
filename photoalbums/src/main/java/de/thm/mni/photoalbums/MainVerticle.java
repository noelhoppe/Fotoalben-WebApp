package de.thm.mni.photoalbums;

import de.thm.mni.photoalbums.handler.LoginHandler;
import io.vertx.config.ConfigRetriever;
import io.vertx.config.ConfigRetrieverOptions;
import io.vertx.config.ConfigStoreOptions;
import io.vertx.core.*;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.FileSystemAccess;
import io.vertx.ext.web.handler.SessionHandler;
import io.vertx.ext.web.handler.StaticHandler;
import io.vertx.ext.web.sstore.LocalSessionStore;
import io.vertx.jdbcclient.JDBCPool;

/**
 * Die MainVerticle-Klasse ist der Haupteinstiegspunkt für die Vert.x-Anwendung.
 * Sie konfiguriert die Anwendung, indem sie Konfigurationen aus einer Konfigurationsdatei liest,
 * initialisiert einen JDBC Pool und stellt einen HTTP Server bereit, der Anfragen über ein Router-Objekt verarbeitet.
 */
public class MainVerticle extends AbstractVerticle {

  private JsonObject config;
  private JDBCPool jdbcPool;

  /**
   * List Konfigurationen aus einer Konfigurationsdatei, speichert diese in einem privaten Feld der Klasse,
   * initialisiert einen JDBC Pool und stellt einen HTTP Server bereit, der Anfragen über ein Router-Objekt verarbeitet.
   *
   * @param startPromise ein Promise, das anzeigt, ob der Startvorgang erfolgreich oder fehlerhaft war.
   * @throws Exception falls ein Fehler während des Startvorgangs auftritt
   */
  @Override
  public void start(Promise<Void> startPromise) throws Exception {
    doConfig()
              .compose(this::storeConfig)
              .compose(this::configureSqlClient)
              .compose(this::configureRouter)
              .compose(this::startHttpServer)
              .onComplete(startPromise);
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
    router.route().handler(BodyHandler.create());

    // Session-Handler, um sich zu merken, ob ein Nutzer eingeloggt ist
    router.route().handler(SessionHandler.create(
              LocalSessionStore.create(vertx)
    ));

    // Static Handler, um *.html auszuliefern
    router.route().handler(StaticHandler.create(FileSystemAccess.RELATIVE, "views")
              .setCachingEnabled(false) // während Entwicklungsprozess
              .setIndexPage("login.html")
    );


    LoginHandler loginHandler = new LoginHandler(jdbcPool);
    router.route(HttpMethod.POST, "/login").handler(loginHandler::handleLogin);



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
}
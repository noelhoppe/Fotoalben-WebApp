package de.thm.mni.photoalbums;

import io.vertx.config.ConfigRetriever;
import io.vertx.config.ConfigRetrieverOptions;
import io.vertx.config.ConfigStoreOptions;
import io.vertx.config.spi.ConfigStore;
import io.vertx.core.*;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.core.http.HttpServerResponse;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;

/**
 * Die MainVerticle-Klasse ist der Haupteinstiegspunkt für die Vert.x-Anwendung.
 * Sie konfiguriert die Anwendung, indem sie Konfigurationen lädt und andere Verticles bereitstellt.
 */
public class MainVerticle extends AbstractVerticle {

  /**
   * Initialisiert die Konfigurations- und Bereitstellungslogik und startet die Verticles.
   *
   * @param startPromise ein Promise, das anzeigt, ob der Startvorgang erfolgreich oder fehlerhaft war.
   * @throws Exception falls ein Fehler während des Startvorgangs auftritt
   */
  @Override
  public void start(Promise<Void> startPromise) throws Exception {
    doConfig()
              .compose(this::deployOtherVerticles)
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

    return Future.future(retriever::getConfig);
  }

  /**
   * Stellt andere Verticles bereit, nachdem die Konfiguration geladen wurde.
   *
   * <p>Diese Methode erstellt Bereitstellungsoptionen mit der geladenen Konfiguration und
   * stellt dann die {@link WebVerticle} und {@link DatabaseVerticle} bereit.
   * Sie gibt ein Future zurück, das abgeschlossen wird, wenn beide Verticles erfolgreich bereitgestellt wurden.
   *
   * @param loadedConfig die geladene Konfiguration als {@link JsonObject}
   * @return Ein {@link Future}, das abgeschlossen wird, wenn beide Verticles erfolgreich bereitgestellt wurden
   */
  Future<Void> deployOtherVerticles(JsonObject loadedConfig) {
    DeploymentOptions opts = new DeploymentOptions().setConfig(loadedConfig);

    Future<String> dbVerticle = Future.future(promise -> vertx.deployVerticle(new DatabaseVerticle(), opts, promise));
    Future<String> webVerticle = Future.future(promise -> vertx.deployVerticle(new WebVerticle(), opts, promise));

    return Future.all(dbVerticle, webVerticle).mapEmpty();
  }

}
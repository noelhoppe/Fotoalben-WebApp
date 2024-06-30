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

public class MainVerticle extends AbstractVerticle {
  final JsonObject loadedConfig = new JsonObject();

  @Override
  public void start(Promise<Void> startPromise) throws Exception {
    doConfig()
              .compose(this::storeConfig)
              .compose(this::deployOtherVerticles)
              .onComplete(startPromise);
  }

  /**
   * Liest die Konfiguration aus einer JSON-Datei aus.
   *
   * <p>Diese Methode richtet einen Konfigurationsspeicher ein, der aus einer Datei
   * unter "./src/main/java/de/thm/mni/photoalbums/config.json" liest. Sie erstellt
   * dann einen Konfigurationsabruf mit diesem Speicher und gibt ein Future zurück,
   * das mit der Konfiguration als {@link JsonObject} abgeschlossen wird.
   *
   * @return Ein {@link Future}, das mit der Konfiguration als {@link JsonObject} abgeschlossen wird
   */
  Future<JsonObject> doConfig() {
    ConfigStoreOptions defaultConfig = new ConfigStoreOptions()
              .setType("file")
              .setConfig(new JsonObject().put("path", "./src/main/java/de/thm/mni/photoalbums/config.json"));

    ConfigRetrieverOptions opts = new ConfigRetrieverOptions()
              .addStore(defaultConfig);

    ConfigRetriever retriever = ConfigRetriever.create(vertx, opts);
    return Future.future(promise -> retriever.getConfig(promise));
  }

  /**
   * Speichert die übergebene Konfiguration.
   * @param config Die zu speichernde Konfiguration als {@link JsonObject}
   * @return Ein {@link Future}, das signalisiert, dass die Speicherung erfolgreich war
   */
  Future<Void> storeConfig(JsonObject config) {
    loadedConfig.mergeIn(config);
    return Future.succeededFuture();
  }

  Future<Void> deployOtherVerticles(Void unused) {
    DeploymentOptions opts = new DeploymentOptions().setConfig(loadedConfig);

    Future<String> webVerticle = Future.future(promise -> vertx.deployVerticle(new WebVerticle(), opts, promise));
    Future<String> dbVerticle = Future.future(promise -> vertx.deployVerticle(new DatabaseVerticle(), opts, promise));

    return Future.all(webVerticle, dbVerticle).mapEmpty();
  }
}

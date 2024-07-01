package de.thm.mni.photoalbums;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.handler.SessionHandler;
import io.vertx.ext.web.sstore.LocalSessionStore;
import io.vertx.ext.web.sstore.SessionStore;

/**
 * Die WebVerticle-Klasse stellt einen HTTP-Server bereit, der Anfragen über ein Router-Objekt behandelt.
 */
public class WebVerticle extends AbstractVerticle {

	/**
	 * Startet die Verticle und initialisiert die Router- und HTTP-Server-Konfiguration.
	 *
	 * @param startPromise ein Promise, das anzeigt, ob der Startvorgang erfolgreich war
	 * @throws Exception falls ein Fehler während des Startvorgangs auftritt
	 */
	@Override
	public void start(Promise<Void> startPromise) throws Exception {
		configureRouter()
			.compose(this::startHttpServer)
			.onComplete(startPromise);
	}

	/**
	 * Konfiguriert den Router mit den erforderlichen Routen.
	 * @return Ein {@link Future}, das einen konfigurierten {@link Router} enthält
	 */
	Future<Router> configureRouter() {
		Router router = Router.router(vertx);

		// Session
		SessionStore sessionStore = LocalSessionStore.create(vertx); // Verticles kommunizieren zwar miteinander aber es wird keine verteilte Sitzungsverwaltung benötigt
		router.route().handler(SessionHandler.create(sessionStore));

		// TODO: Implementierung der Routen!
		// TODO: Chained Routes: Prüfe, dass ein SessionObjekt existiert!
		router.route(HttpMethod.GET, "/").handler(this::listAllUsers);



		return Future.succeededFuture(router);
	}

	/**
	 * Startet den HTTP-Server und bindet ihn an den konfigurierten Port.
	 *
	 * <p>Der Port wird aus der Konfiguration gelesen, die als JSON-Objekt vorliegt.
	 * Der HTTP-Server verwendet den übergebenen {@link Router} als Request-Handler.
	 *
	 * @param router der konfigurierte {@link Router}, der als Request-Handler dient
	 * @return Ein {@link Future}, das abgeschlossen wird, wenn der HTTP-Server erfolgreich gestartet wurde
	 */
	Future<Void> startHttpServer(Router router) {
		JsonObject http = config().getJsonObject("http");
		int httpPort = http.getInteger("port");

		HttpServer server = vertx.createHttpServer().requestHandler(router);

		return Future.<HttpServer>future(promise -> server.listen(httpPort, promise)).mapEmpty();
	}


	void listAllUsers(RoutingContext ctx) {
		vertx.eventBus().request(DatabaseVerticle.LIST_ALL_USERS_ADDR, "", reply -> {
			ctx.request().response().end(reply.result().body().toString());
		});
	}
}

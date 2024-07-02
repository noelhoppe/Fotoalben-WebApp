package de.thm.mni.photoalbums;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.jdbc.JDBCAuthentication;
import io.vertx.ext.auth.sqlclient.SqlAuthenticationOptions;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.handler.*;
import io.vertx.ext.web.sstore.LocalSessionStore;
import io.vertx.ext.web.sstore.SessionStore;
import io.vertx.ext.auth.authorization.AuthorizationProvider;
import io.vertx.ext.auth.authentication.AuthenticationProvider;
import io.vertx.ext.auth.sqlclient.SqlAuthentication;
import io.vertx.jdbcclient.JDBCPool;


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
		// FIXME: Warum null?
		// JDBC-Pool aus dem vertx Kontext holen
		JDBCPool jdbcPool = vertx.getOrCreateContext().get(DatabaseVerticle.JDBC_POOL_KEY);

		configureRouter(jdbcPool)
			.compose(this::startHttpServer)
			.onComplete(startPromise);
	}

	/**
	 * Konfiguriert den Router mit den erforderlichen Routen.
	 * @param jdbcPool der JDBC-Pool, der für die Authentifizierung und Autorisierung verwendet wird
	 * @return Ein {@link Future}, das einen konfigurierten {@link Router} enthält
	 */
	Future<Router> configureRouter(JDBCPool jdbcPool) {
		Router router = Router.router(vertx);

		// Body-Handler, um body des http-req zu parsen und an den RoutingContext weiterzugeben
		router.route().handler(BodyHandler.create());

		// Session-Handler, um sich zu merken, ob ein Nutzer eingeloggt ist
		router.route().handler(SessionHandler.create(
			LocalSessionStore.create(vertx)
		));

		// Static Handler, um *.html auszuliefern
		router.route().handler(StaticHandler.create(FileSystemAccess.RELATIVE, "views")
			.setCachingEnabled(false) // während Entwicklungsmodus
			.setIndexPage("login.html")
		);

		AuthenticationProvider authProvider = SqlAuthentication.create(jdbcPool);

		AuthenticationHandler formLoginHandler = FormLoginHandler.create(
			authProvider, "username", "password", "returnURL", "/test"
		);
		router.route().handler(formLoginHandler);


		// TODO: Implementierung der Routen!
		// TODO: Chained Routes: Prüfe, dass ein SessionObjekt existiert!
		// router.route(HttpMethod.GET, "/").handler(this::listAllUsers);



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

	/*
	void handleLogin(RoutingContext ctx) {
		JsonObject user = ctx.body().asJsonObject().getJsonObject("user");
		String username = user.getString("username");
		String password = user.getString("password");

	}
	 */


	void listAllUsers(RoutingContext ctx) {
		vertx.eventBus().request(DatabaseVerticle.LIST_ALL_USERS_ADDR, "", reply -> {
			ctx.request().response().end(reply.result().body().toString());
		});
	}
}
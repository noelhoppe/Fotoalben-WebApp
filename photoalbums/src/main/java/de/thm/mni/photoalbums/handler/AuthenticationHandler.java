package de.thm.mni.photoalbums.handler;

import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;

public class AuthenticationHandler {
	/**
	 * Wenn das Session-Objekt leer ist, d.h. kein Benutzer angemeldet ist, wird die http-Anfrage hier mit einem 401 Unauthorized und einer entsprechenden Fehlermeldung abgewiesen. <br>
	 * Wenn das Session-Objekt nicht leer ist, d.h. ein Benutzer angemeldet ist, wird die http-Anfrage an den nächsten handler weitergegeben und weiterverarbeitet.<br>
	 * @param ctx Der Routing Context
	 */
	public void isLoggedIn(RoutingContext ctx) {
		System.out.println("called isLoggedIn in AuthenticationHandler.java");
		if (ctx.session().isEmpty()) {
			ctx.response().setStatusCode(401).end(new JsonObject().put("message", "Bitte melde dich zuerst an, um diese Route aufzurufen").encodePrettily());
		} else {
			System.out.println("ctx.next() called");
			ctx.next();
		}
	}

	/**
	 * Prüft, ob der angemeldete Benutzer der Admin ist.
	 * Wenn ja, rufe den nächsten Handler auf.
	 * Wenn nein, beende die Anfrage mit einem 403 und entsprechender Fehlermeldung.
	 * @param ctx
	 */
	public void isAdmin(RoutingContext ctx) {
		System.out.println("called isAdmin in AuthenticationHandler.java");
		if (ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ROLE).equals("ADMIN")) {
			ctx.next();
		} else {
			MainVerticle.response(ctx.response(), 403, new JsonObject().put("message", "Der angemeldete Benutzer ist kein Admin"));
		}
	}
}

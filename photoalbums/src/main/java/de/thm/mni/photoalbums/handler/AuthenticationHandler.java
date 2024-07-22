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
	public void authenticate(RoutingContext ctx) {
		if (ctx.session().isEmpty()) {
			ctx.response().setStatusCode(401).end(new JsonObject().put("message", "Bitte melde dich zuerst an, um diese Route aufzurufen").encodePrettily());
		} else {
			ctx.next();
		}
	}


}

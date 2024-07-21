package de.thm.mni.photoalbums.handler;

import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.ext.web.RoutingContext;

public class AuthenticationHandler {


	/**
	 * Wer bin ich? Welcher Benutzer ist angemeldet?
	 * Wenn das Session-Objekt leer ist, d.h. kein Benutzer angemeldet ist, wird die http-Anfrage hier mit einem 401 Unauthorized und einer entsprechenden Fehlermeldung abgewiesen.
	 * Wenn das Session-Objekt nicht leer ist, d.h. ein Benutzer angemeldet ist, wird die http-Anfrage an den nächsten handler weitergegeben und weiterverarbeitet.
	 * @param ctx
	 */
	public void authenticate(RoutingContext ctx) {
		if (ctx.session().isEmpty()) {
			System.out.println("Unauthorized");
			ctx.response().setStatusCode(401).end();
		} else {
			System.out.println("Authorized");
			ctx.next();
		}
	}


}

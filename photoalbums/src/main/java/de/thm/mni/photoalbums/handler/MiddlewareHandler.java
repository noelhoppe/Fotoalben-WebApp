package de.thm.mni.photoalbums.handler;

import de.thm.mni.photoalbums.MainVerticle;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;

public class MiddlewareHandler {

	public MiddlewareHandler() { }

	public void middleware(RoutingContext ctx) {
		if (ctx.session().get(MainVerticle.SESSION_ATTRIBUTE_ROLE).equals("ADMIN")) {
			ctx.next();
		} else {
			ctx.response()
				.setStatusCode(403)
				.end(new JsonObject()
					.put("message", "Sie haben keine Berechtigung diese Funktion auszuführen. Bitte kontaktieren sie ihren Administrator.")
					.encode()
				);
		}
	}
}

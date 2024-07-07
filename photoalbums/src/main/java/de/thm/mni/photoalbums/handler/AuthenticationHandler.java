package de.thm.mni.photoalbums.handler;

import io.vertx.ext.web.RoutingContext;

public class AuthenticationHandler {


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

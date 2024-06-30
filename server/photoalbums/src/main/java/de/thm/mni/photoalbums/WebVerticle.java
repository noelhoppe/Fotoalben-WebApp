package de.thm.mni.photoalbums;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;

public class WebVerticle extends AbstractVerticle {
	@Override
	public void start(Promise<Void> startPromise) throws Exception {
		configureRouter()
			.compose(this::startHttpServer)
			.onComplete(startPromise);
	}

	Future<Router> configureRouter() {
		Router router = Router.router(vertx);

		router.route(HttpMethod.GET, "/").handler(this::helloVertX);

		return Future.succeededFuture(router);
	}

	Future<Void> startHttpServer(Router router) {
		JsonObject http = config().getJsonObject("http");
		int httpPort = http.getInteger("port");

		HttpServer server = vertx.createHttpServer().requestHandler(router);

		return Future.<HttpServer>future(promise -> server.listen(httpPort, promise)).mapEmpty();
	}


	void helloVertX(RoutingContext ctx) {
		ctx.request().response().end("HelloVertX");
	}
}

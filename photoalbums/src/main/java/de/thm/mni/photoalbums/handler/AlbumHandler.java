package de.thm.mni.photoalbums.handler;

import io.vertx.jdbcclient.JDBCPool;

public class AlbumHandler {

  private final JDBCPool jdbcPool;

  public AlbumHandler(JDBCPool jdbcPool) {
    this.jdbcPool = jdbcPool;
  }
}

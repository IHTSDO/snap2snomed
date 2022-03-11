package org.snomed.snap2snomed.integration;

import org.testcontainers.containers.MySQLContainer;

public class Snap2SnomedMySqlContainer extends MySQLContainer {

  private static final String IMAGE_VERSION = NAME + ":5.7.34";
  private static Snap2SnomedMySqlContainer container;

  private Snap2SnomedMySqlContainer() {
    super(IMAGE_VERSION);
  }

  public static Snap2SnomedMySqlContainer getInstance() {
    if (container == null) {
      container = new Snap2SnomedMySqlContainer();
      container.setCommand("--character_set_server=utf8mb4 --collation-server=utf8mb4_unicode_ci --max-allowed-packet=2000000");
      container.urlParameters.put("cachePrepStmts", "true");
      container.urlParameters.put("useServerPrepStmts", "false");
      container.urlParameters.put("rewriteBatchedStatements", "true");
    }
    return container;
  }

  @Override
  public String getJdbcUrl() {
    String additionalUrlParams = this.constructUrlParameters("?", "&");
    return "jdbc:mariadb://" + this.getHost() + ":" + this.getMappedPort(MYSQL_PORT) + "/" + this.getDatabaseName() + additionalUrlParams;
  }

  @Override
  public String getDriverClassName() {
      return "org.mariadb.jdbc.Driver";
  }

  @Override
  public void start() {
    super.start();
    System.setProperty("DB_URL", container.getJdbcUrl());
    System.setProperty("DB_USERNAME", container.getUsername());
    System.setProperty("DB_PASSWORD", container.getPassword());
  }

  @Override
  public void stop() {
    //do nothing, JVM handles shut down
  }
}

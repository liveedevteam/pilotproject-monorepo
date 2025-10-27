import {
  developmentConfig,
  developmentDrizzleConfig,
} from "./environments/development";
import { testConfig, testDrizzleConfig } from "./environments/test";
import {
  productionConfig,
  productionDrizzleConfig,
} from "./environments/production";

const environment = process.env.NODE_ENV || "development";

export const getDatabaseConfig = () => {
  switch (environment) {
    case "test":
      return testConfig;
    case "production":
      return productionConfig;
    default:
      return developmentConfig;
  }
};

export const getDrizzleConfig = () => {
  switch (environment) {
    case "test":
      return testDrizzleConfig;
    case "production":
      return productionDrizzleConfig;
    default:
      return developmentDrizzleConfig;
  }
};

export {
  developmentConfig,
  testConfig,
  productionConfig,
  developmentDrizzleConfig,
  testDrizzleConfig,
  productionDrizzleConfig,
};

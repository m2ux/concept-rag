import { ConceptRAGError } from './base.js';

/**
 * Base class for configuration errors.
 * Thrown when configuration is invalid or missing.
 */
export class ConfigurationError extends ConceptRAGError {
  constructor(
    message: string,
    configKey: string,
    cause?: Error
  ) {
    super(
      message,
      `CONFIG_${configKey.toUpperCase()}_ERROR`,
      { configKey },
      cause
    );
  }
}

/**
 * Thrown when a required configuration key is missing.
 */
export class MissingConfigError extends ConfigurationError {
  constructor(configKey: string) {
    super(
      `Required configuration key '${configKey}' is missing`,
      configKey
    );
  }
}

/**
 * Thrown when a configuration value is invalid.
 */
export class InvalidConfigError extends ConfigurationError {
  constructor(
    configKey: string,
    value: unknown,
    reason: string
  ) {
    super(
      `Configuration '${configKey}' is invalid: ${reason}`,
      configKey
    );
    this.context.value = value;
    this.context.reason = reason;
  }
}


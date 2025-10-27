import { rawClient } from "../core/client";

export interface TransactionOptions {
  timeout?: number;
  isolationLevel?:
    | "READ UNCOMMITTED"
    | "READ COMMITTED"
    | "REPEATABLE READ"
    | "SERIALIZABLE";
}

export class TransactionManager {
  static async withTransaction<T>(
    callback: (tx: any) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const result = await rawClient.begin(async tx => {
      if (options.isolationLevel) {
        await tx`SET TRANSACTION ISOLATION LEVEL ${tx.unsafe(options.isolationLevel)}`;
      }

      if (options.timeout) {
        await tx`SET statement_timeout = ${options.timeout}`;
      }

      return await callback(tx);
    });
    return result as T;
  }

  static async withSavepoint<T>(
    tx: typeof rawClient,
    savepointName: string,
    callback: () => Promise<T>
  ): Promise<T> {
    await tx`SAVEPOINT ${tx.unsafe(savepointName)}`;

    try {
      const result = await callback();
      await tx`RELEASE SAVEPOINT ${tx.unsafe(savepointName)}`;
      return result;
    } catch (error) {
      await tx`ROLLBACK TO SAVEPOINT ${tx.unsafe(savepointName)}`;
      throw error;
    }
  }

  static async retryOnConflict<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 100
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if it's a serialization failure or deadlock
        const isRetryableError =
          lastError.message.includes("serialization_failure") ||
          lastError.message.includes("deadlock_detected") ||
          lastError.message.includes("could not serialize access");

        if (!isRetryableError || attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay =
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

export const transactionHelpers = {
  /**
   * Execute multiple operations in a single transaction
   */
  batch: async <T>(
    operations: (() => Promise<T>)[],
    options?: TransactionOptions
  ): Promise<T[]> => {
    return await TransactionManager.withTransaction(async tx => {
      const results: T[] = [];
      for (const operation of operations) {
        results.push(await operation());
      }
      return results;
    }, options);
  },

  /**
   * Execute operations with automatic retry on conflict
   */
  withRetry: TransactionManager.retryOnConflict,

  /**
   * Execute with savepoint for partial rollback capability
   */
  withSavepoint: TransactionManager.withSavepoint,

  /**
   * Execute in read-only transaction
   */
  readOnly: async <T>(
    callback: (tx: typeof rawClient) => Promise<T>
  ): Promise<T> => {
    return await TransactionManager.withTransaction(async tx => {
      await tx`SET TRANSACTION READ ONLY`;
      return await callback(tx);
    });
  },

  /**
   * Execute with specific isolation level
   */
  withIsolation: async <T>(
    isolationLevel: TransactionOptions["isolationLevel"],
    callback: (tx: typeof rawClient) => Promise<T>
  ): Promise<T> => {
    return await TransactionManager.withTransaction(callback, {
      isolationLevel,
    });
  },
};

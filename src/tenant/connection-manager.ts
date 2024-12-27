import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Connection } from 'mongoose';

@Injectable()
export class ConnectionManager implements OnModuleDestroy {
  private connections = new Map<string, Connection>();

  set(tenantId: string, connection: Connection) {
    this.connections.set(tenantId, connection);
  }

  get(tenantId: string): Connection | undefined {
    return this.connections.get(tenantId);
  }

  has(tenantId: string): boolean {
    return this.connections.has(tenantId);
  }

  async remove(tenantId: string): Promise<void> {
    const connection = this.connections.get(tenantId);
    if (connection) {
      await connection.close();
      this.connections.delete(tenantId);
    }
  }

  // Clean up connections when application shuts down
  async onModuleDestroy() {
    for (const [tenantId, connection] of this.connections) {
      await connection.close();
    }
    this.connections.clear();
  }
}

import { DomainEvent } from "../aggregates/DomainEvents";

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

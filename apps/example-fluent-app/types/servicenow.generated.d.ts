declare namespace ServiceNow {
  interface GlideSystem {
    info(message: string): void;
    error(message: string): void;
    getUserID(): string;
  }

  interface GlideRecord {
    addQuery(field: string, value: string): void;
    query(): void;
    next(): boolean;
    getValue(field: string): string;
    setValue(field: string, value: string): void;
    update(): string;
  }
}

declare const gs: ServiceNow.GlideSystem;

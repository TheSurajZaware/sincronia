/* eslint-disable @typescript-eslint/naming-convention */
declare const now: {
  include: <T>(name: string) => T;
};

export class SampleTaskRules {
  static validateName(current: { u_name: string }): void {
    if (!current.u_name || current.u_name.trim().length < 3) {
      throw new Error("Task name must be at least 3 characters.");
    }
  }

  static withSharedModule(current: { u_name: string }): string {
    const shared = now.include<{ normalizeName(value: string): string }>(
      "x_sincronia.SharedTaskUtils",
    );
    return shared.normalizeName(current.u_name);
  }
}

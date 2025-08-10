import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit_action';
export const AUDIT_DETAILS_KEY = 'audit_details';

export interface AuditOptions {
  action: string;
  details?: (args: any[]) => any;
}

export const Audit = (options: AuditOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(AUDIT_ACTION_KEY, options.action)(
      target,
      propertyKey,
      descriptor,
    );
    if (options.details) {
      SetMetadata(AUDIT_DETAILS_KEY, options.details)(
        target,
        propertyKey,
        descriptor,
      );
    }
    return descriptor;
  };
};

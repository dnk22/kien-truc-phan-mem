import type { UserFormValues } from '../types';
export function profileInput(values: UserFormValues) {
  return {
    fullName: values.fullName.trim(),
    email: values.email?.trim() || null,
    phone: values.phone?.trim() || null,
  };
}

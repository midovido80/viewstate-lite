import type {ContactPhone} from '@/types/domain';

export function orderedPhoneChoices(phones:readonly ContactPhone[]):ContactPhone[]{return [...phones].sort((a,b)=>Number(b.isPrimary)-Number(a.isPrimary))}
export const callUri=(phone:Pick<ContactPhone,'normalized'>)=>`tel:${phone.normalized}`;
export const whatsappUri=(phone:Pick<ContactPhone,'normalized'>)=>`https://wa.me/${phone.normalized.slice(1)}`;

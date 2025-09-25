export type EnrollmentStatus =
  | 'pending'
  | 'active'
  | 'waitlisted'
  | 'cancelled'
  | 'completed';

export interface EnrollResponse {
  enrollmentId: string;
  status: EnrollmentStatus;
  seatsLeft?: number | null;
  seats_left?: number | null;
}

export interface PaymentIntentResponse {
  checkoutUrl?: string | null;
  providerRef?: string | null;
  provider?: string | null;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[];
}

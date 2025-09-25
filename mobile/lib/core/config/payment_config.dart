const paymentReturnUrl = String.fromEnvironment(
  'PAYMENT_RETURN_URL',
  defaultValue: 'iroha://payment/return',
);

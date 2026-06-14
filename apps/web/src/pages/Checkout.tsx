import { useForm }           from 'react-hook-form';
import { zodResolver }       from '@hookform/resolvers/zod';
import { z }                 from 'zod';
import { useNavigate }       from 'react-router-dom';
import { useState }          from 'react';
import { CreditCard, Lock }  from 'lucide-react';
import { useCart }           from '../hooks/useCart';
import { useCreateOrderMutation, useProcessPaymentMutation } from '../features/orders/ordersApi';
import { useAppDispatch }    from '../app/store';
import { addToast }          from '../features/ui/uiSlice';
import { formatPrice }       from '../lib/utils';
import { cn }                from '../lib/utils';

const shippingSchema = z.object({
  fullName:   z.string().min(2, 'Full name required'),
  street:     z.string().min(5, 'Street address required'),
  city:       z.string().min(2, 'City required'),
  state:      z.string().min(2, 'State required'),
  postalCode: z.string().min(3, 'Postal code required'),
  country:    z.string().min(2, 'Country required'),
  phone:      z.string().min(7, 'Phone number required'),
});

const paymentSchema = z.object({
  method:        z.enum(['credit_card', 'debit_card', 'upi', 'net_banking']),
  cardNumber:    z.string().length(16, '16 digits required').regex(/^\d+$/).optional(),
  cardExpiry:    z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'MM/YY format').optional(),
  cardCvv:       z.string().length(3, '3 digits').regex(/^\d+$/).optional(),
  cardName:      z.string().min(2, 'Cardholder name required').optional(),
});

type ShippingData = z.infer<typeof shippingSchema>;
type PaymentData  = z.infer<typeof paymentSchema>;

const PAYMENT_METHODS = [
  { value: 'credit_card',  label: 'Credit card' },
  { value: 'debit_card',   label: 'Debit card' },
  { value: 'upi',          label: 'UPI' },
  { value: 'net_banking',  label: 'Net banking' },
];

export default function Checkout() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const { cart }  = useCart();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');

  const [createOrder,   { isLoading: creatingOrder   }] = useCreateOrderMutation();
  const [processPayment, { isLoading: processingPayment }] = useProcessPaymentMutation();

  const shippingForm = useForm<ShippingData>({ resolver: zodResolver(shippingSchema) });
  const paymentForm  = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: 'credit_card' },
  });

  const selectedMethod = paymentForm.watch('method');
  const isCard = ['credit_card', 'debit_card'].includes(selectedMethod);

  const shippingCost = (cart?.total ?? 0) >= 100 ? 0 : 9.99;
  const tax          = Math.round((cart?.total ?? 0) * 0.08 * 100) / 100;
  const orderTotal   = Math.round(((cart?.total ?? 0) + shippingCost + tax) * 100) / 100;

  const onShippingNext = shippingForm.handleSubmit(() => setStep('payment'));

  const onPaymentSubmit = paymentForm.handleSubmit(async (payData) => {
    const shippingData = shippingForm.getValues();
    try {
      // Step 1: Create order
      const orderRes = await createOrder({
        shippingAddress: shippingData,
      }).unwrap();

      const orderId = orderRes.data?.order._id;
      if (!orderId) throw new Error('Order creation failed');

      // Step 2: Process payment
      await processPayment({
        orderId,
        method: payData.method,
        ...(isCard && {
          cardDetails: {
            number: payData.cardNumber!,
            expiry: payData.cardExpiry!,
            cvv:    payData.cardCvv!,
            name:   payData.cardName!,
          },
        }),
      }).unwrap();

      navigate(`/order/${orderId}`);
    } catch (err: any) {
      dispatch(addToast({
        type:    'error',
        message: err.data?.message ?? 'Something went wrong. Please try again.',
      }));
    }
  });

  const isSubmitting = creatingOrder || processingPayment;

  if (!cart || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="page-container py-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {['shipping', 'payment'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              step === s || (s === 'shipping' && step === 'payment')
                ? 'gradient-brand text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
            )}>
              {i + 1}
            </div>
            <span className={cn(
              'text-sm font-medium capitalize',
              step === s ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
            )}>{s}</span>
            {i < 1 && <div className="w-12 h-px bg-[var(--border)]" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Forms */}
        <div className="lg:col-span-2">

          {/* Shipping form */}
          {step === 'shipping' && (
            <div className="card p-6">
              <h2 className="font-bold text-lg text-[var(--text-primary)] mb-6">Shipping address</h2>
              <form onSubmit={onShippingNext} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Full name</label>
                  <input {...shippingForm.register('fullName')} className="input-base" placeholder="John Doe" />
                  {shippingForm.formState.errors.fullName && (
                    <p className="text-xs text-red-500 mt-1">{shippingForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Street address</label>
                  <input {...shippingForm.register('street')} className="input-base" placeholder="123 Main Street" />
                  {shippingForm.formState.errors.street && (
                    <p className="text-xs text-red-500 mt-1">{shippingForm.formState.errors.street.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">City</label>
                    <input {...shippingForm.register('city')} className="input-base" placeholder="Mumbai" />
                    {shippingForm.formState.errors.city && (
                      <p className="text-xs text-red-500 mt-1">{shippingForm.formState.errors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">State</label>
                    <input {...shippingForm.register('state')} className="input-base" placeholder="Maharashtra" />
                    {shippingForm.formState.errors.state && (
                      <p className="text-xs text-red-500 mt-1">{shippingForm.formState.errors.state.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Postal code</label>
                    <input {...shippingForm.register('postalCode')} className="input-base" placeholder="400001" />
                    {shippingForm.formState.errors.postalCode && (
                      <p className="text-xs text-red-500 mt-1">{shippingForm.formState.errors.postalCode.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Country</label>
                    <input {...shippingForm.register('country')} className="input-base" placeholder="India" />
                    {shippingForm.formState.errors.country && (
                      <p className="text-xs text-red-500 mt-1">{shippingForm.formState.errors.country.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Phone</label>
                  <input {...shippingForm.register('phone')} className="input-base" placeholder="+91 98765 43210" />
                  {shippingForm.formState.errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{shippingForm.formState.errors.phone.message}</p>
                  )}
                </div>
                <button type="submit" className="btn-primary w-full py-3 mt-2">
                  Continue to payment
                </button>
              </form>
            </div>
          )}

          {/* Payment form */}
          {step === 'payment' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Payment</h2>
                <button
                  onClick={() => setStep('shipping')}
                  className="text-sm text-[var(--brand-purple)] hover:underline"
                >
                  ← Edit shipping
                </button>
              </div>

              <form onSubmit={onPaymentSubmit} className="space-y-5">
                {/* Payment method tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m.value}
                      className={cn(
                        'flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium',
                        selectedMethod === m.value
                          ? 'border-[var(--brand-purple)] bg-[var(--brand-purple)]/5 text-[var(--brand-purple)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand-purple)]/40'
                      )}
                    >
                      <input
                        {...paymentForm.register('method')}
                        type="radio"
                        value={m.value}
                        className="sr-only"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>

                {/* Card fields */}
                {isCard && (
                  <div className="space-y-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Card details</span>
                      <Lock className="w-3 h-3 ml-auto text-green-500" />
                      <span className="text-green-500 text-xs">Secure</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Card number</label>
                      <input
                        {...paymentForm.register('cardNumber')}
                        className="input-base font-mono"
                        placeholder="1234 5678 9012 3456"
                        maxLength={16}
                      />
                      {paymentForm.formState.errors.cardNumber && (
                        <p className="text-xs text-red-500 mt-1">{paymentForm.formState.errors.cardNumber.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Expiry</label>
                        <input {...paymentForm.register('cardExpiry')} className="input-base" placeholder="MM/YY" />
                        {paymentForm.formState.errors.cardExpiry && (
                          <p className="text-xs text-red-500 mt-1">{paymentForm.formState.errors.cardExpiry.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">CVV</label>
                        <input {...paymentForm.register('cardCvv')} className="input-base" placeholder="123" maxLength={3} />
                        {paymentForm.formState.errors.cardCvv && (
                          <p className="text-xs text-red-500 mt-1">{paymentForm.formState.errors.cardCvv.message}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Cardholder name</label>
                      <input {...paymentForm.register('cardName')} className="input-base" placeholder="John Doe" />
                      {paymentForm.formState.errors.cardName && (
                        <p className="text-xs text-red-500 mt-1">{paymentForm.formState.errors.cardName.message}</p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {creatingOrder   ? 'Creating order…'    :
                   processingPayment ? 'Processing payment…' :
                   `Pay ${formatPrice(orderTotal)}`}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div>
          <div className="card p-5 sticky top-24">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Order summary</h3>
            <div className="space-y-3 mb-4">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] line-clamp-1 font-medium">{item.name}</p>
                    <p className="text-[var(--text-muted)]">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-[var(--text-primary)] shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border)] pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span><span>{formatPrice(cart.total)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Tax</span><span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
                <span>Total</span><span>{formatPrice(orderTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { api } from '@/lib/api';
import { formatPrice, validatePhone } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Address } from '@/types';
import toast from 'react-hot-toast';
import { MapPin, Plus, CreditCard, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, total, count, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('COD');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [upiTxId, setUpiTxId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', label: '',
  });

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const res = await api.getAddresses();
      setAddresses(res.data || []);
      const defaultAddr = res.data?.find((a: Address) => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
    } catch {}
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createAddress(addressForm);
      setAddresses([...addresses, res.data]);
      setSelectedAddress(res.data.id);
      setShowAddressForm(false);
      setAddressForm({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', label: '' });
      toast.success('Address added');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    try {
      const res = await api.validateCoupon(couponCode, total);
      const discount = res.data?.discount || 0;
      if (discount > 0) {
        setCouponDiscount(discount);
        toast.success(`Coupon applied! You save ₹${discount}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid coupon');
      setCouponDiscount(0);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setPlacing(true);
    try {
      const orderData: any = {
        addressId: selectedAddress,
        paymentMethod,
        couponCode: couponCode || undefined,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        })),
      };
      if (paymentMethod === 'UPI' && upiTxId) {
        orderData.upiTxId = upiTxId;
      }

      const res = await api.createOrder(orderData);
      const order = res.data;

      if (paymentMethod === 'RAZORPAY') {
        const rzpRes = await api.createRazorpayOrder(order.id);
        // Initialize Razorpay checkout
        const options = {
          key: rzpRes.data.key,
          amount: rzpRes.data.amount,
          currency: 'INR',
          name: 'STORE NAME',
          order_id: rzpRes.data.id,
          prefill: { name: user?.name, email: user?.email },
          handler: async (response: any) => {
            await api.verifyRazorpayPayment(response);
            toast.success('Payment successful!');
            await clearCart();
            router.push(`/orders/${order.orderNumber}`);
          },
          modal: { ondismiss: () => setPlacing(false) },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else if (paymentMethod === 'STRIPE') {
        const stripeRes = await api.createStripePaymentIntent(order.id);
        // Stripe integration would go here
        toast.success('Order placed!');
        await clearCart();
        router.push(`/orders/${order.orderNumber}`);
      } else {
        toast.success('Order placed successfully!');
        await clearCart();
        router.push(`/orders/${order.orderNumber}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setPlacing(false);
  };

  if (!user || items.length === 0) {
    return (
      <div className="container-custom py-20 text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={32} />
        <p className="text-gray-500">{!user ? 'Redirecting to login...' : 'Your cart is empty'}</p>
      </div>
    );
  }

  const shipping = total >= 499 ? 0 : 49;
  const orderTotal = total - couponDiscount + shipping;

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Address */}
          <div className="border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><MapPin size={20} /> Delivery Address</h2>
              <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-sm text-[#1a1a2e] flex items-center gap-1">
                <Plus size={14} /> Add New
              </button>
            </div>
            {showAddressForm ? (
              <form onSubmit={handleAddAddress} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Full Name *" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} required />
                  <Input label="Phone *" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} required />
                </div>
                <Input label="Address Line 1 *" value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} required />
                <Input label="Address Line 2" value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} />
                <div className="grid grid-cols-3 gap-3">
                  <Input label="City *" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required />
                  <Input label="State *" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required />
                  <Input label="Pincode *" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} required />
                </div>
                <Button type="submit" size="sm">Save Address</Button>
              </form>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`block border p-4 cursor-pointer ${selectedAddress === addr.id ? 'border-[#1a1a2e] bg-gray-50' : ''}`}>
                    <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="sr-only" />
                    <p className="text-sm font-medium">{addr.fullName} - {addr.phone}</p>
                    <p className="text-sm text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="border p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><CreditCard size={20} /> Payment Method</h2>
            <div className="space-y-3">
              {[
                { value: 'COD', label: 'Cash on Delivery', desc: 'Pay when you receive' },
                { value: 'RAZORPAY', label: 'Razorpay', desc: 'Credit/Debit Card, Net Banking, UPI' },
                { value: 'STRIPE', label: 'Stripe', desc: 'International Cards' },
                { value: 'UPI', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
              ].map((method) => (
                <label key={method.value} className={`flex items-center justify-between border p-4 cursor-pointer ${paymentMethod === method.value ? 'border-[#1a1a2e] bg-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} />
                    <div>
                      <p className="text-sm font-medium">{method.label}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {paymentMethod === 'UPI' && (
              <div className="mt-4 border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold">UPI Payment Details</h3>
                <div className="bg-gray-50 p-4 text-center">
                  <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
                    <p className="text-sm text-gray-400">QR Code<br />Scan to Pay</p>
                  </div>
                  <p className="text-xs text-gray-500">Scan QR or use UPI ID below</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">UPI ID:</p>
                    <p className="text-gray-600 font-mono">storename@upi</p>
                  </div>
                  <div>
                    <p className="font-medium">Bank Details:</p>
                    <p className="text-gray-600">Store Name Pvt Ltd</p>
                    <p className="text-gray-600">HDFC Bank | A/C: 1234567890 | IFSC: HDFC0001234</p>
                  </div>
                </div>
                <Input
                  label="UPI Transaction ID *"
                  value={upiTxId}
                  onChange={(e) => setUpiTxId(e.target.value)}
                  placeholder="Enter UPI Transaction ID"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border p-6 h-fit sticky top-24">
          <h2 className="text-lg font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm mb-4">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="truncate max-w-[200px]">{item.product.name} x{item.quantity}</span>
                <span>{formatPrice((item.product.salePrice || item.product.basePrice) * item.quantity)}</span>
              </div>
            ))}
            {items.length > 3 && <p className="text-xs text-gray-400">+{items.length - 3} more items</p>}
          </div>
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? <span className="text-green-600">FREE</span> : formatPrice(shipping)}</span></div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(couponDiscount)}</span></div>
            )}
            <div className="border-t pt-2 flex justify-between text-base font-bold"><span>Total</span><span>{formatPrice(orderTotal)}</span></div>
          </div>
          <div className="mt-4">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="w-full border px-4 py-3 text-sm outline-none mb-2"
            />
            <Button variant="outline" size="sm" className="w-full" onClick={handleApplyCoupon}>
              Apply Coupon
            </Button>
          </div>
          <Button className="w-full mt-4" onClick={handlePlaceOrder} loading={placing}>
            Place Order - {formatPrice(orderTotal)}
          </Button>
        </div>
      </div>
    </div>
  );
}

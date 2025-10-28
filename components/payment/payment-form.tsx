"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { notifications } from '@/lib/notifications';
import { paymentUtils } from '@/lib/stripe';
import { SubscriptionPlan } from '@/lib/types/api';

interface PaymentFormProps {
  plan: SubscriptionPlan;
  onSuccess?: (subscriptionId: string) => void;
  onCancel?: () => void;
}

export default function PaymentForm({ plan, onSuccess, onCancel }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
    email: '',
    billingAddress: '',
    city: '',
    zipCode: '',
    country: 'US',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Format expiry date
    else if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!paymentUtils.validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!paymentUtils.validateExpiryDate(formData.expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date';
    }

    if (!paymentUtils.validateCVC(formData.cvc)) {
      newErrors.cvc = 'Invalid CVC';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (!formData.billingAddress.trim()) {
      newErrors.billingAddress = 'Billing address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      notifications.error('Validation Error', 'Please check your input and try again.');
      return;
    }

    setLoading(true);

    try {
      // Here you would integrate with Stripe to process the payment
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      notifications.success(
        'Payment Successful',
        `Successfully subscribed to ${plan.name} plan!`
      );
      
      onSuccess?.('sub_1234567890');
    } catch (error) {
      notifications.error(
        'Payment Failed',
        'Failed to process payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const cardType = paymentUtils.getCardType(formData.cardNumber);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Plan Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="text-muted-foreground">{plan.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {paymentUtils.formatAmount(plan.price * 100, plan.currency)}
            </div>
            <div className="text-sm text-muted-foreground">
              per {plan.interval || 'month'}
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Form */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <CreditCard className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Payment Information</h3>
          <Lock className="h-4 w-4 text-green-500" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <label htmlFor="cardNumber" className="text-sm font-medium">
              Card Number
            </label>
            <div className="relative">
              <Input
                id="cardNumber"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                className={errors.cardNumber ? 'border-red-500' : ''}
                maxLength={19}
              />
              {cardType !== 'unknown' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="outline" className="text-xs">
                    {cardType.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
            {errors.cardNumber && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.cardNumber}</span>
              </p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="expiryDate" className="text-sm font-medium">
                Expiry Date
              </label>
              <Input
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                placeholder="MM/YY"
                className={errors.expiryDate ? 'border-red-500' : ''}
                maxLength={5}
              />
              {errors.expiryDate && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.expiryDate}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="cvc" className="text-sm font-medium">
                CVC
              </label>
              <Input
                id="cvc"
                name="cvc"
                value={formData.cvc}
                onChange={handleInputChange}
                placeholder="123"
                className={errors.cvc ? 'border-red-500' : ''}
                maxLength={4}
              />
              {errors.cvc && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.cvc}</span>
                </p>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <label htmlFor="cardholderName" className="text-sm font-medium">
              Cardholder Name
            </label>
            <Input
              id="cardholderName"
              name="cardholderName"
              value={formData.cardholderName}
              onChange={handleInputChange}
              placeholder="John Doe"
              className={errors.cardholderName ? 'border-red-500' : ''}
            />
            {errors.cardholderName && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.cardholderName}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Billing Address */}
          <div className="space-y-4">
            <h4 className="font-medium">Billing Address</h4>
            
            <div className="space-y-2">
              <label htmlFor="billingAddress" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="billingAddress"
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                placeholder="123 Main Street"
                className={errors.billingAddress ? 'border-red-500' : ''}
              />
              {errors.billingAddress && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.billingAddress}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">
                  City
                </label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="New York"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.city}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="zipCode" className="text-sm font-medium">
                  ZIP Code
                </label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="10001"
                  className={errors.zipCode ? 'border-red-500' : ''}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.zipCode}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <h4 className="font-medium text-green-900">Secure Payment</h4>
                <p className="text-sm text-green-700">
                  Your payment information is encrypted and secure. We never store your card details.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay {paymentUtils.formatAmount(plan.price * 100, plan.currency)}
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}


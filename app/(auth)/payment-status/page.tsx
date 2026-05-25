// app/(auth)/payment-status/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentStatusPage() {
  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your Pro subscription has been activated. You can now enjoy unlimited checks and premium features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please sign in to access your account and start using the Pro features.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
           
            <Link href="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">Go to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
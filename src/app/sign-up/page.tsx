import Link from 'next/link';
import AuthLayout from '@/app/components/auth/AuthLayout';
import SignUpForm from '@/app/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start building a better relationship with your time."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-text underline underline-offset-2 transition-colors hover:text-primary"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthLayout>
  );
}

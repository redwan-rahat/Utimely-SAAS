import AuthLayout from "@/app/components/auth/AuthLayout";
import SignInForm from "@/app/components/auth/SignInForm";
import Link from "next/link";


export default function SignInPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Utimely account"
      footer={
        <>
          Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-text underline underline-offset-2 transition-colors hover:text-primary"
        >
          Sign up
        </Link>
        </>
      }
    >
      <SignInForm />
    </AuthLayout>
  );
}
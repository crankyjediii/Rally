import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 bg-surface-primary">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-rally-500 to-rally-pink flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            R
          </div>
          <h1 className="text-2xl font-bold gradient-text">
            Welcome back
          </h1>
          <p className="text-sm mt-1 text-text-secondary">
            Sign in to save your routes and track progress
          </p>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#a78bfa',
              colorBackground: 'var(--surface-primary)',
              colorText: 'var(--text-primary)',
              colorTextSecondary: 'var(--text-secondary)',
              colorInputBackground: 'var(--surface-secondary)',
              colorInputText: 'var(--text-primary)',
              borderRadius: '12px',
            },
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border border-border-default bg-surface-card backdrop-blur-xl',
              headerTitle: 'text-text-primary font-bold',
              headerSubtitle: 'text-text-secondary',
              formButtonPrimary:
                'bg-linear-to-r from-rally-500 to-rally-pink hover:from-rally-400 hover:to-pink-400 text-white font-semibold rounded-xl transition-all duration-200',
              footerActionLink: 'text-rally-adaptive hover:text-rally-500',
              dividerLine: 'border-border-default',
              dividerText: 'text-text-muted',
              socialButtonsBlockButton:
                'border border-border-default bg-surface-secondary text-text-primary hover:bg-surface-elevated rounded-xl transition-all duration-200',
              socialButtonsBlockButtonText: 'text-text-primary',
              formFieldInput:
                'bg-surface-secondary border border-border-default text-text-primary rounded-xl focus:border-rally-500/50',
              formFieldLabel: 'text-text-secondary',
              identityPreviewText: 'text-text-primary',
              identityPreviewEditButtonIcon: 'text-text-muted',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </main>
  );
}

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            R
          </div>
          <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome back
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary, #a1a1aa)' }}>
            Sign in to save your routes and track progress
          </p>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#a78bfa',
              colorBackground: '#0f0f17',
              colorText: '#f4f4f5',
              colorTextSecondary: '#a1a1aa',
              colorInputBackground: '#1a1a2e',
              colorInputText: '#f4f4f5',
              borderRadius: '12px',
            },
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border border-white/10 bg-white/5 backdrop-blur-xl',
              headerTitle: 'text-zinc-100 font-bold',
              headerSubtitle: 'text-zinc-400',
              formButtonPrimary:
                'bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 text-white font-semibold rounded-xl transition-all duration-200',
              footerActionLink: 'text-violet-400 hover:text-violet-300',
              dividerLine: 'border-white/10',
              dividerText: 'text-zinc-500',
              socialButtonsBlockButton:
                'border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 rounded-xl transition-all duration-200',
              socialButtonsBlockButtonText: 'text-zinc-200',
              formFieldInput:
                'bg-white/5 border border-white/10 text-zinc-100 rounded-xl focus:border-violet-500/50',
              formFieldLabel: 'text-zinc-300',
              identityPreviewText: 'text-zinc-200',
              identityPreviewEditButtonIcon: 'text-zinc-400',
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

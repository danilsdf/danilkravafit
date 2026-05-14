import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Hybrid Athlete Hub",
  description: "Privacy Policy for Hybrid Athlete Hub by Danil Kravchenko.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-24 md:px-10 lg:px-0">
        <section className="w-full">

          <div className="mb-10 border-b border-white/10 pb-10">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.25em] text-white/45">
              Legal
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-3 text-sm text-white/50">Last updated: May 14, 2026</p>
          </div>

          <div className="space-y-8 text-[15px] leading-relaxed text-white/70">

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us, such as when you create an account,
                fill in a form, or contact us. This may include your name, email address, and any other
                information you choose to provide.
              </p>
              <p className="mt-3">
                We also automatically collect certain information when you visit our site, including
                IP address, browser type, referring URLs, and pages visited, via analytics tools such
                as Google Analytics.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                2. How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                3. Sharing of Information
              </h2>
              <p>
                We do not sell, trade, or otherwise transfer your personally identifiable information
                to third parties. This does not include trusted third parties who assist us in operating
                our website or servicing you, so long as those parties agree to keep this information
                confidential.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                4. Cookies
              </h2>
              <p>
                Our site may use cookies to enhance your experience. You can choose to disable cookies
                through your browser settings, though this may affect some functionality of the site.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                5. Third-Party Services
              </h2>
              <p>
                We use third-party services including Google Analytics, Stripe (for payments), and
                Strava (for activity data). Each of these services has its own privacy policy governing
                the use of your information.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                6. Data Security
              </h2>
              <p>
                We implement reasonable security measures to protect your personal information.
                However, no method of transmission over the internet is 100% secure, and we cannot
                guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                7. Your Rights
              </h2>
              <p>
                You may request access to, correction of, or deletion of your personal data at any
                time by contacting us at the email below.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                8. Contact
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a
                  href="mailto:danil.kravchenko.dev@gmail.com"
                  className="text-white underline underline-offset-2 hover:text-white/70"
                >
                  danil.kravchenko.dev@gmail.com
                </a>
                .
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}

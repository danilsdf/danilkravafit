import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Hybrid Athlete Hub",
  description: "Terms of Service for Hybrid Athlete Hub by Danil Kravchenko.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-24 md:px-10 lg:px-0">
        <section className="w-full">

          <div className="mb-10 border-b border-white/10 pb-10">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.25em] text-white/45">
              Legal
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
            <p className="mt-3 text-sm text-white/50">Last updated: May 14, 2026</p>
          </div>

          <div className="space-y-8 text-[15px] leading-relaxed text-white/70">

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using Hybrid Athlete Hub (&ldquo;the Site&rdquo;), you accept and agree to be
                bound by these Terms of Service. If you do not agree, please do not use the Site.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                2. Use of the Site
              </h2>
              <p>
                You agree to use the Site only for lawful purposes and in a manner that does not
                infringe the rights of others. You must not misuse or attempt to gain unauthorized
                access to any part of the Site or its related systems.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                3. Accounts
              </h2>
              <p>
                If you create an account, you are responsible for maintaining the confidentiality of
                your credentials and for all activity that occurs under your account. Notify us
                immediately of any unauthorized use.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                4. Content
              </h2>
              <p>
                All content on the Site, including training programs, meal prep plans, and articles,
                is provided for informational purposes only. It does not constitute professional
                medical, nutritional, or fitness advice. Consult a qualified professional before
                beginning any new training or diet program.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                5. Payments & Memberships
              </h2>
              <p>
                Certain features require a paid membership. All payments are processed securely via
                Stripe. Prices are subject to change with notice. Refunds are handled on a
                case-by-case basis — contact us within 7 days of purchase if you have an issue.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                6. Intellectual Property
              </h2>
              <p>
                All content, logos, and materials on the Site are the intellectual property of
                Danil Kravchenko unless otherwise stated. You may not reproduce, distribute, or create
                derivative works without prior written permission.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                7. Disclaimer of Warranties
              </h2>
              <p>
                The Site is provided &ldquo;as is&rdquo; without warranties of any kind. We do not warrant
                that the Site will be error-free, uninterrupted, or free of viruses or other harmful
                components.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                8. Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by law, Danil Kravchenko shall not be liable for any
                indirect, incidental, special, or consequential damages arising from your use of the
                Site or its content.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                9. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these Terms at any time. Continued use of the Site
                after changes are posted constitutes your acceptance of the revised Terms.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-widest text-white/40">
                10. Contact
              </h2>
              <p>
                For questions about these Terms, contact us at{" "}
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

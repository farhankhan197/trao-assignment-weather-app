import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Mausam",
  description: "Terms of Service for Mausam Weather Dashboard",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-body">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] mb-8 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Home
        </Link>

        <h1 className="text-4xl font-display text-[var(--text-primary)] mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Last updated: May 7, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">1. Acceptance of Terms</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              By accessing or using Mausam (“the Service”), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. The Service is provided as a personal project and hiring assessment demonstration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">2. Description of Service</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Mausam is a weather dashboard that allows registered users to track weather across multiple cities, view AI-powered insights, and receive proactive weather alerts based on upcoming Google Calendar events. The Service aggregates publicly available weather data from third-party APIs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">3. Google Calendar Integration</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The Service offers an optional integration with Google Calendar. By connecting your Google Calendar, you authorize Mausam to:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 mt-2">
              <li>Access your calendar events in <strong>read-only</strong> mode.</li>
              <li>Read event titles, start times, and locations for the purpose of generating weather alerts.</li>
              <li>Store your Google account email for display and identification purposes.</li>
            </ul>
            <p className="text-[var(--text-secondary)] leading-relaxed mt-3">
              This integration is entirely <strong>user-initiated and revocable</strong>. You may disconnect your Google Calendar at any time via the Settings page or through your Google Account security settings. Upon disconnection, all stored tokens and calendar-derived data are immediately deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">4. User Accounts</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              To use certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">5. Acceptable Use</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 mt-2">
              <li>Violate any applicable laws or regulations.</li>
              <li>Infringe on the intellectual property rights of others.</li>
              <li>Attempt to gain unauthorized access to the Service, its servers, or any connected systems.</li>
              <li>Use automated scripts or bots to interact with the Service in ways that place undue load on our infrastructure.</li>
              <li>Reverse engineer, decompile, or disassemble any aspect of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">6. Disclaimer of Warranties</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The Service and all weather data provided through it are offered on an “as is” and “as available” basis. We make no warranties, express or implied, regarding the accuracy, reliability, or timeliness of weather forecasts. Weather data is sourced from third-party providers (Open-Meteo, OpenWeatherMap) and may not reflect real-time conditions at your exact location.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">7. Limitation of Liability</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              To the fullest extent permitted by law, Mausam and its operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising out of or in connection with your use of the Service.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed mt-2">
              <strong>Important:</strong> Weather alerts generated by the Service are advisory only. Always verify weather conditions independently before making travel or safety decisions. We are not responsible for any consequences arising from reliance on our weather alerts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">8. Termination</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We reserve the right to suspend or terminate your account and access to the Service at any time, with or without notice, for any reason, including violation of these Terms. You may also delete your account at any time by contacting us. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">9. Changes to Terms</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We may update these Terms from time to time. We will notify you of significant changes by posting the new Terms on this page and updating the “Last updated” date. Your continued use of the Service after any changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">10. Governing Law</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">11. Contact Information</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              If you have any questions about these Terms, please contact us at:{" "}
              <a href="mailto:farhankhan.code@gmail.com" className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline">
                farhankhan.code@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

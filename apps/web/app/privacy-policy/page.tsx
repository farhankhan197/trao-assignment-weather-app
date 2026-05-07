import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Mausam",
  description: "Privacy Policy for Mausam Weather Dashboard",
};

export default function PrivacyPolicyPage() {
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

        <h1 className="text-4xl font-display text-[var(--text-primary)] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Last updated: May 7, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">1. Overview</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Mausam (“we”, “us”, or “our”) is a multi-user weather dashboard built as a personal project and hiring assessment. This Privacy Policy explains how we collect, use, store, and protect your information when you use our service, including when you connect your Google Calendar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-1">Account Information</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  When you register, we collect your name and email address. Your password is hashed using bcrypt before storage.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-1">Google Calendar Data</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  If you choose to connect Google Calendar, we request the following Google OAuth scopes:
                </p>
                <ul className="list-disc list-inside text-[var(--text-secondary)] mt-2 space-y-1">
                  <li><code className="text-sm bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded">calendar.readonly</code> — read-only access to your calendar events</li>
                  <li><code className="text-sm bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded">openid</code> — authentication identity</li>
                  <li><code className="text-sm bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded">email</code> — your Google account email</li>
                </ul>
                <p className="text-[var(--text-secondary)] leading-relaxed mt-3">
                  We access only the event <strong>title</strong>, <strong>start time</strong>, and <strong>location</strong> fields from events in your primary calendar occurring within the next 7 days. We do not access attendees, descriptions, attachments, or any other calendar metadata.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-1">Weather Alerts</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  When our background scan generates a weather alert for a calendar event, we store: event title, event location, forecast date, weather condition, temperature range, precipitation probability, severity level, and a generated message. These are linked to your user account in our database.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
              <li><strong>Weather Alerts:</strong> We geocode event locations and fetch weather forecasts to generate proactive weather alerts for your upcoming events.</li>
              <li><strong>Authentication:</strong> Google tokens are used solely to access your calendar on your behalf. Your email is used to identify the connected account and display it in Settings.</li>
              <li><strong>Service Improvement:</strong> We do not use your data for advertising, profiling, or training AI models.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">4. Data Retention & Deletion</h2>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
              <li>Raw calendar event data is processed in-memory during scans and is <strong>not persisted</strong> to our database.</li>
              <li>Generated weather alerts are stored until the event passes, after which they are automatically deleted during the next daily scan.</li>
              <li>If you disconnect Google Calendar, all associated tokens, your connected Google email, and all calendar alerts are <strong>immediately deleted</strong> from our systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">5. Security</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We use JSON Web Tokens (JWT) stored in <code className="text-sm bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded">httpOnly</code> cookies for session management. Google OAuth tokens are encrypted-at-rest in our MongoDB database and are <strong>never included</strong> in API responses sent to the client. All communication between the frontend and backend occurs over HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">6. Third-Party Services</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We use the following third-party APIs:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 mt-2">
              <li><strong>Open-Meteo</strong> — for weather forecasts and historical data. Only geocoded coordinates are shared.</li>
              <li><strong>OpenWeatherMap Geocoding</strong> — to convert event locations into latitude/longitude coordinates.</li>
              <li><strong>Groq (LLM)</strong> — for AI-powered weather insights via LangChain.</li>
            </ul>
            <p className="text-[var(--text-secondary)] leading-relaxed mt-3">
              We do not sell, rent, or share your personal data with any third parties for marketing or commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">7. How to Disconnect Google Calendar</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              You can revoke our access to your Google Calendar at any time:
            </p>
            <ol className="list-decimal list-inside text-[var(--text-secondary)] space-y-3">
              <li>
                <strong>In-App Disconnection (Recommended)</strong>
                <p className="ml-6 mt-1">
                  Go to <strong>Settings</strong> in the Mausam dashboard and click <strong>Disconnect Google Calendar</strong>. This immediately revokes our access token, deletes all stored tokens and alerts from our database, and removes the app from your Google Account permissions.
                </p>
              </li>
              <li>
                <strong>Google Account Security Settings</strong>
                <p className="ml-6 mt-1">
                  Visit <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline">Google Account → Security → Third-party apps</a> and remove “Mausam” from the list of connected apps.
                </p>
              </li>
            </ol>
            <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
              Disconnecting will stop all future calendar scans and delete all existing weather alerts associated with your calendar events.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">8. Your Rights</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              You have the right to access, correct, or delete your personal data. To request deletion of your entire account and all associated data, please contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">9. Contact Us</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:{" "}
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

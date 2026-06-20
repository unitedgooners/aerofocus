// Structured content for the in-app Privacy Policy and Terms of Service,
// rendered by LegalDocScreen. Keeping the actual text here (not hardcoded
// into the screen component) makes it easy to update wording without
// touching layout code.

export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  lastUpdated: 'June 2026',
  sections: [
    {
      heading: '1. Information We Collect',
      body: [
        'Account Information: When you create an account, we collect your email address, a username you choose, and your account password (stored securely and encrypted by our authentication provider — we never see or store your password in plain text).',
        'Study Session Data: When you use the App to track study sessions, we collect session duration and timestamps, the study mode you select, subjects you optionally enter, and flight data associated with your session.',
        "In-App Activity: We collect data related to your use of the App's features, including your in-app cash balance and transaction history, aircraft and boarding pass themes you own, your study streak, and social activity such as follows and encouragement (\u201ccheers\u201d) sent to other users, if you choose to use these features.",
        'Payment Information: If you subscribe to AeroFocus Premium, payment is processed by Stripe, Inc. We do not collect or store your full credit card number, expiration date, or CVC.',
        'Information We Do Not Collect: We do not collect your precise device location. We do not use third-party advertising or analytics tracking services.',
      ],
    },
    {
      heading: '2. How We Use Your Information',
      body: [
        'We use the information we collect to provide, operate, and maintain the App; track and display your study sessions, statistics, and progress; process subscription payments and manage your account tier; calculate and award in-app currency and rewards; enable optional social features; communicate with you about your account; and maintain the security and integrity of the Service.',
      ],
    },
    {
      heading: '3. How We Share Your Information',
      body: [
        'We do not sell your personal information. We share information only with service providers necessary to operate the App: Supabase for account authentication and data storage, Stripe for payment processing, and Railway for backend hosting.',
        'To power the App\u2019s core functionality, we query live aircraft position data from OpenSky Network, a third-party flight tracking service. This does not involve sharing your personal information with OpenSky.',
        'We may disclose information if required by law, or if AeroFocus is involved in a merger, acquisition, or sale of assets.',
      ],
    },
    {
      heading: '4. Data Retention',
      body: [
        'We retain your account and study session data for as long as your account remains active. If you delete your account, we permanently delete your profile, study session history, in-app fleet and theme ownership, cash balance, and related social activity immediately. This action cannot be undone.',
      ],
    },
    {
      heading: '5. Your Rights and Choices',
      body: [
        'You can update your account information at any time within the App, delete your account and all associated data permanently from the Settings screen, and request a copy of your data by contacting us.',
      ],
    },
    {
      heading: "6. Children's Privacy",
      body: [
        'AeroFocus is not directed to children under 13, and we do not knowingly collect personal information from children under 13.',
      ],
    },
    {
      heading: '7. Security',
      body: [
        'We take reasonable measures to protect your information, including encryption of data in transit and secure storage of authentication credentials. No method of transmission or storage is completely secure.',
      ],
    },
    {
      heading: '8. Changes to This Policy',
      body: [
        'We may update this Privacy Policy from time to time. We will notify you of material changes by updating the date above, and where appropriate, through an in-app notice.',
      ],
    },
    {
      heading: '9. Contact Us',
      body: [
        'If you have questions about this Privacy Policy or your data, contact us at: [your support email here]',
      ],
    },
  ],
}

export const TERMS_OF_SERVICE = {
  title: 'Terms of Service',
  lastUpdated: 'June 2026',
  sections: [
    {
      heading: '1. Eligibility',
      body: [
        'You must be at least 13 years old to use AeroFocus. If you are under the age of majority in your jurisdiction, you represent that a parent or guardian has reviewed and agreed to these Terms on your behalf.',
      ],
    },
    {
      heading: '2. Your Account',
      body: [
        'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.',
      ],
    },
    {
      heading: '3. Description of Service',
      body: [
        'AeroFocus is a study-focus application that pairs your study sessions with real, live flight data. AeroFocus includes gamified features such as in-app currency, a collectible aircraft fleet, boarding pass customization, and optional social features.',
        'In-app currency, aircraft, and boarding pass themes have no real-world monetary value, cannot be exchanged for cash, and exist solely for use within the App.',
      ],
    },
    {
      heading: '4. Subscriptions and Payment',
      body: [
        'AeroFocus offers a free tier and an optional paid subscription ("Premium") billed on a recurring basis through Stripe, our third-party payment processor.',
        'Subscriptions automatically renew until cancelled. You may cancel at any time; Premium access continues until the end of the current billing period. We do not provide refunds for partial subscription periods except where required by law. Prices are subject to change with reasonable advance notice.',
      ],
    },
    {
      heading: '5. Acceptable Use',
      body: [
        'You agree not to use the App for any unlawful purpose, attempt to gain unauthorized access to our systems or other users\u2019 accounts, interfere with or disrupt the App\u2019s operation, misrepresent your identity, or exploit bugs to obtain in-app currency or features you have not legitimately earned.',
        'We reserve the right to suspend or terminate accounts that violate these Terms.',
      ],
    },
    {
      heading: '6. Third-Party Flight Data',
      body: [
        'AeroFocus relies on third-party services, including OpenSky Network, to provide live aircraft data. We do not control and are not responsible for the accuracy, availability, or completeness of this data. Flight information is provided for entertainment and study-motivation purposes only and should not be relied upon for any operational, navigational, or safety purpose.',
      ],
    },
    {
      heading: '7. Intellectual Property',
      body: [
        'The App, including its design, features, illustrations, and content, is owned by AeroFocus and protected by applicable intellectual property laws.',
      ],
    },
    {
      heading: '8. Account Termination',
      body: [
        'You may delete your account at any time through the Settings screen. Account deletion is permanent and immediately removes your profile, study session history, in-app currency, fleet, themes, and related social activity. This action cannot be reversed.',
      ],
    },
    {
      heading: '9. Disclaimers',
      body: [
        'The App is provided "as is" and "as available" without warranties of any kind. We do not warrant that the App will be uninterrupted, error-free, or that live flight data will always be accurate or available.',
      ],
    },
    {
      heading: '10. Limitation of Liability',
      body: [
        'To the maximum extent permitted by law, AeroFocus shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the App.',
      ],
    },
    {
      heading: '11. Changes to These Terms',
      body: [
        'We may update these Terms from time to time. Continued use of the App after changes take effect constitutes acceptance of the revised Terms.',
      ],
    },
    {
      heading: '12. Governing Law',
      body: [
        'These Terms are governed by the laws of the jurisdiction in which AeroFocus operates, without regard to conflict of law principles.',
      ],
    },
    {
      heading: '13. Contact Us',
      body: [
        'If you have questions about these Terms, contact us at: [your support email here]',
      ],
    },
  ],
}
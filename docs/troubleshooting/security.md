# Security Troubleshooting

When a security product such as ThreatDown blocks the Netlify preview domain for
this project, use the guidance below to regain access safely.

## 1. Migrate to a custom domain

1. Log in to Netlify and open the Bolt site dashboard.
2. Select **Domain management → Add custom domain**.
3. Enter a hostname owned by your organization (for example,
   `bolt.example.com`).
4. Follow Netlify's DNS instructions to create the necessary CNAME or A
   records.
5. Once DNS propagates, use the new domain for day-to-day access. Because the
   domain is now branded to your organization, endpoint protection tools are
   far less likely to block it.

## 2. Request that security teams allow-list the preview domain

1. Gather the details from the block notification (domain, IP address, port,
   and threat category).
2. File a ticket with your security or IT operations team explaining that the
   Netlify preview URL is a legitimate internal project.
3. Provide justification: the site is read-only, hosts your application's
   preview build, and is required for development review.
4. Include a screenshot or log entry from the security tool to speed up their
   review.
5. After approval, confirm that the preview URL is reachable again.

## 3. Use local development while waiting

- Run `npm install` and `npm run dev` to view the application on
  `http://localhost:5173`.
- Share video recordings or screenshots of features with teammates who still
  cannot access the hosted preview.

## 4. Re-try after changes

Security vendors update their threat intelligence regularly. If you continue to
use the Netlify domain, schedule periodic re-tests to confirm the allow-list
entry remains active and the site is still accessible.

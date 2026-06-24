/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL =
  'https://slfrgidtfobpxhmhlmeh.supabase.co/storage/v1/object/public/email-assets/deped-logo.png'

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for the DepEd AI Registry</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} alt="DepEd" width="56" height="56" style={logo} />
          <Text style={brand}>DepEd AI Registry</Text>
        </Section>

        <Section style={card}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset the password for your{' '}
            {siteName || 'DepEd AI Registry'} account. Click the button below
            to choose a new password. This link will expire in 1 hour for your
            security.
          </Text>

          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button style={button} href={confirmationUrl}>
              Reset password
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you didn't request a password reset, you can safely ignore this
            email — your password will remain unchanged.
          </Text>
        </Section>

        <Text style={legal}>
          © {new Date().getFullYear()} DepEd AI Registry · Department of
          Education, Republic of the Philippines
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

// Brand: primary hsl(216, 72%, 22%) = #0F2E5C, accent hsl(199, 80%, 45%) = #178FCF
const main = {
  backgroundColor: '#F5F7FA',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  margin: 0,
  padding: '40px 0',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 20px',
}
const header = {
  textAlign: 'center' as const,
  padding: '0 0 24px',
}
const logo = {
  margin: '0 auto 12px',
  display: 'block',
}
const brand = {
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#0F2E5C',
  margin: 0,
}
const card = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E2E8EE',
  padding: '40px 36px',
  boxShadow: '0 1px 2px rgba(15, 46, 92, 0.04)',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#0F2E5C',
  margin: '0 0 16px',
  lineHeight: '1.3',
}
const text = {
  fontSize: '15px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '0 0 8px',
}
const button = {
  backgroundColor: '#0F2E5C',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: 600,
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const smallText = {
  fontSize: '13px',
  color: '#64748B',
  margin: '24px 0 6px',
}
const link = {
  fontSize: '13px',
  color: '#178FCF',
  wordBreak: 'break-all' as const,
  margin: 0,
}
const hr = {
  borderColor: '#E2E8EE',
  margin: '28px 0 20px',
}
const footer = {
  fontSize: '13px',
  color: '#64748B',
  lineHeight: '1.5',
  margin: 0,
}
const legal = {
  fontSize: '11px',
  color: '#94A3B8',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}

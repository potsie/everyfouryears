import { Nav } from '@/components/Nav';
import { PageHero } from '@/components/PageHero';
import { ContactForm } from './ContactForm';

export const metadata = { title: 'Contact' };

export default function ContactPage() {
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? '';

  return (
    <>
      <Nav activePath="/contact" />
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 24px 60px',
        }}
      >
        <PageHero
          eyebrow="Get in touch"
          title="Contact"
          sub="Questions, corrections, broken scores, or just saying hello — send a note and it lands in our inbox."
        />

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--sh-1)',
            padding: '26px 28px',
          }}
        >
          {accessKey ? (
            <ContactForm accessKey={accessKey} />
          ) : (
            <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14.5 }}>
              The contact form isn&apos;t configured yet. Set{' '}
              <code>NEXT_PUBLIC_WEB3FORMS_KEY</code> in your environment to
              enable it.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

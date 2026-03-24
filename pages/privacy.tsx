import Head from "next/head";
import Layout from "@/components/Layout";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <Head>
        <title>Privacy Policy — Pipcasso</title>
      </Head>
      <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="mb-3">When you place an order or use Pipcasso, we may collect:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Name and email address</li>
            <li>Shipping address (for physical print orders)</li>
            <li>Payment information (processed securely by Stripe — we never store card details)</li>
            <li>Photos you upload to generate your dice mosaic</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>To process and fulfill your order</li>
            <li>To send your order confirmation and download links via email</li>
            <li>To fulfill physical print orders through our print partner, Gelato</li>
            <li>To communicate with you about your order or commission</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Photos You Upload</h2>
          <p className="text-gray-700">
            Photos you upload are used solely to generate your dice mosaic. We do not share, sell, or use your photos for any other purpose. Uploaded photos may be stored temporarily on our servers and are not shared with third parties except as necessary to generate and deliver your mosaic.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
          <p className="mb-3 text-gray-700">We use the following third-party services to operate Pipcasso:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Gelato</strong> — print fulfillment (receives your name, address, and mosaic image for print orders)</li>
            <li><strong>Resend</strong> — transactional email delivery</li>
            <li><strong>Supabase</strong> — secure database storage</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
          <p className="text-gray-700">
            We retain your order information as long as necessary to fulfill your order and comply with legal obligations. You may request deletion of your data at any time by emailing us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p className="text-gray-700">
            You have the right to access, correct, or delete your personal data. To make a request, contact us at{" "}
            <a href="mailto:getpipcasso@gmail.com" className="underline text-blue-600">getpipcasso@gmail.com</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
          <p className="text-gray-700">
            Questions about this policy? Email us at{" "}
            <a href="mailto:getpipcasso@gmail.com" className="underline text-blue-600">getpipcasso@gmail.com</a>.
          </p>
        </section>
      </main>
    </Layout>
  );
}

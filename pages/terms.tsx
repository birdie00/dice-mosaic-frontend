import Head from "next/head";
import Layout from "@/components/Layout";

export default function TermsOfService() {
  return (
    <Layout>
      <Head>
        <title>Terms of Service — Pipcasso</title>
      </Head>
      <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
          <p className="text-gray-700">
            Pipcasso ("we", "us", "our") operates pipcasso.com. By using our site or purchasing from us, you agree to these terms. Please read them carefully.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Products & Services</h2>
          <p className="mb-3 text-gray-700">We offer the following products:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li><strong>Digital Downloads</strong> — high-resolution mosaic image files delivered via email link</li>
            <li><strong>Framed Prints</strong> — physical prints of your dice mosaic fulfilled and shipped by Gelato</li>
            <li><strong>Commissions</strong> — custom hand-built dice mosaic artwork created and shipped by us</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Photos & Content You Upload</h2>
          <p className="text-gray-700">
            By uploading a photo, you confirm that you have the right to use it and grant us a limited license to process it for the purpose of generating your mosaic. You retain full ownership of your photos. We do not use your photos for any other purpose.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Payments</h2>
          <p className="text-gray-700">
            All payments are processed securely by Stripe. By completing a purchase, you authorize the charge to your payment method. Prices are listed in USD.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Digital Downloads</h2>
          <p className="text-gray-700">
            Digital downloads are delivered via a unique link sent to your email after purchase. Links are valid for a limited time. Due to the digital nature of these products, all sales are final once the file has been delivered.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Physical Prints</h2>
          <p className="text-gray-700">
            Physical prints are fulfilled by Gelato and typically ship within 3–7 business days. Shipping times vary by location. We are not responsible for delays caused by shipping carriers or customs.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Commissions</h2>
          <p className="text-gray-700">
            Commission pricing ranges from $1,000–$3,000 depending on size and complexity. A deposit may be required to begin work. Commissions are custom-made to order — please see our Refund Policy for details on cancellations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
          <p className="text-gray-700">
            All site content, branding, and mosaic generation technology is owned by Pipcasso. You may not reproduce, resell, or distribute our tools or outputs without permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
          <p className="text-gray-700">
            Pipcasso is not liable for indirect, incidental, or consequential damages. Our total liability to you shall not exceed the amount you paid for the order in question.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
          <p className="text-gray-700">
            Questions? Email us at{" "}
            <a href="mailto:getpipcasso@gmail.com" className="underline text-blue-600">getpipcasso@gmail.com</a>.
          </p>
        </section>
      </main>
    </Layout>
  );
}

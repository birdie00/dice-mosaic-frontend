import Head from "next/head";
import Layout from "@/components/Layout";

export default function RefundPolicy() {
  return (
    <Layout>
      <Head>
        <title>Refund Policy — Pipcasso</title>
      </Head>
      <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
        <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Digital Downloads</h2>
          <p className="text-gray-700">
            Because digital files are delivered immediately upon purchase, <strong>all digital download sales are final</strong>. We do not offer refunds once a download link has been delivered to your email.
          </p>
          <p className="mt-3 text-gray-700">
            If you did not receive your download link or experienced a technical issue, please contact us at{" "}
            <a href="mailto:getpipcasso@gmail.com" className="underline text-blue-600">getpipcasso@gmail.com</a>{" "}
            and we will make it right.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Framed Prints</h2>
          <p className="text-gray-700">
            If your print arrives damaged or defective, contact us within <strong>7 days of delivery</strong> with a photo of the damage and we will arrange a replacement at no cost to you.
          </p>
          <p className="mt-3 text-gray-700">
            Because prints are custom-made to order, we do not accept returns or offer refunds for change of mind. Please review your mosaic preview carefully before purchasing.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Commissions</h2>
          <p className="text-gray-700">
            Commissions are custom hand-built pieces. The following cancellation policy applies:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700">
            <li><strong>Before work begins:</strong> Full refund minus any deposit processing fees.</li>
            <li><strong>After work has begun:</strong> No refund, as materials and labor have been committed.</li>
            <li><strong>Delivered commissions:</strong> All sales are final. If the piece was damaged in transit, contact us within 7 days with photos and we will work with you to resolve it.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">How to Contact Us</h2>
          <p className="text-gray-700">
            For any order issues, refund requests, or questions, please email{" "}
            <a href="mailto:getpipcasso@gmail.com" className="underline text-blue-600">getpipcasso@gmail.com</a>{" "}
            with your order details and we'll respond as quickly as possible.
          </p>
        </section>
      </main>
    </Layout>
  );
}

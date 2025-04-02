import Layout from "@/components/Layout";

export default function Contact() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 text-center">Contact Us</h1>
        <p className="mb-6 text-gray-700 text-center">
          Got questions, custom requests, or need help with your order? Reach out below and we’ll get back to you ASAP!
        </p>

        <form className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block font-medium text-gray-800">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Your Name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block font-medium text-gray-800">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block font-medium text-gray-800">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Type your message..."
              required
            />
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Send Message
          </button>
        </form>
      </div>
    </Layout>
  );
}

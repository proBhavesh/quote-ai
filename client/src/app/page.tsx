import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Quote AI - Intelligent Quote Analysis",
  description:
    "AI-powered platform that analyzes quotes and provides accurate cost estimates based on market data.",
};

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
                  Transform Your Quote Analysis with AI
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Get accurate cost estimates and market insights instantly.
                  Upload your quotes and let AI do the heavy lifting.
                </p>
              </div>
              <div className="space-x-4">
                {session ? (
                  <>
                    <Link href="/quotes/new">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 hover:opacity-90"
                      >
                        Upload Quote
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="outline" size="lg">
                        View Dashboard
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 hover:opacity-90"
                      >
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-900"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              Powerful Features
            </h2>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow">
                <div className="inline-block rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Smart PDF Processing</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Upload PDFs and extract all relevant information
                  automatically, including work descriptions and costs.
                </p>
              </div>
              <div className="p-6 space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow">
                <div className="inline-block rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Advanced AI Analysis</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Get accurate cost estimates based on market data and
                  AI-powered analysis with detailed breakdowns.
                </p>
              </div>
              <div className="p-6 space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow">
                <div className="inline-block rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Smart Cost Comparison</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Compare quotes with AI-calculated estimates and identify
                  potential savings with detailed insights.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-800"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid gap-8 md:grid-cols-4">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold">Upload</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Upload your quote documents in PDF format
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold">Process</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Our AI extracts and analyzes the content
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold">Analyze</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Get detailed cost analysis and insights
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xl font-bold">
                  4
                </div>
                <h3 className="text-xl font-bold">Compare</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Compare with market rates and other quotes
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

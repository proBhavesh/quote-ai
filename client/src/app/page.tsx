import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        {/* Hero Section with Animation */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-6 gap-2 transform -skew-y-12 opacity-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="col-span-1 h-20 bg-gray-900 dark:bg-gray-100" />
            ))}
          </div>
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Badge className="px-4 py-2" variant="secondary">
                🚀 Early Access Now Available
              </Badge>
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

        {/* Stats Section */}
        <section className="w-full py-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">10x</h3>
                <p className="text-gray-500 dark:text-gray-400">Faster Analysis</p>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">95%</h3>
                <p className="text-gray-500 dark:text-gray-400">Accuracy Target</p>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">100%</h3>
                <p className="text-gray-500 dark:text-gray-400">Data Security</p>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">24/7</h3>
                <p className="text-gray-500 dark:text-gray-400">Availability</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Hover Cards */}
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-900"
        >
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">Powerful Features</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                Everything you need to analyze and optimize your quotes with AI-powered insights
              </p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <HoverCard>
                <HoverCardTrigger>
                  <div className="p-6 space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
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
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Supported Formats</h4>
                    <p className="text-sm">PDF, Word, Excel, Images</p>
                    <div className="flex gap-2">
                      <Badge>OCR Support</Badge>
                      <Badge>Bulk Upload</Badge>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger>
                  <div className="p-6 space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
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
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">AI Capabilities</h4>
                    <p className="text-sm">Market Rate Analysis, Cost Optimization, Trend Detection</p>
                    <div className="flex gap-2">
                      <Badge>Real-time</Badge>
                      <Badge>ML-Powered</Badge>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger>
                  <div className="p-6 space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
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
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Comparison Features</h4>
                    <p className="text-sm">Line Item Analysis, Historical Data, Market Benchmarks</p>
                    <div className="flex gap-2">
                      <Badge>Visual Charts</Badge>
                      <Badge>Export</Badge>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
        </section>

        {/* How It Works Section with Timeline */}
        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-800"
        >
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                Get started in minutes with our simple four-step process
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-4 relative">
              {/* Timeline connector - single line across all steps */}
              <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 hidden md:block" />
              
              <div className="text-center space-y-4 relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xl font-bold relative z-10">
                  1
                </div>
                <h3 className="text-xl font-bold">Upload</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Upload your quote documents in PDF format
                </p>
              </div>
              <div className="text-center space-y-4 relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xl font-bold relative z-10">
                  2
                </div>
                <h3 className="text-xl font-bold">Process</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Our AI extracts and analyzes the content
                </p>
              </div>
              <div className="text-center space-y-4 relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xl font-bold relative z-10">
                  3
                </div>
                <h3 className="text-xl font-bold">Analyze</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Get detailed cost analysis and insights
                </p>
              </div>
              <div className="text-center space-y-4 relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xl font-bold relative z-10">
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

        {/* Testimonials Section replaced with Launch Offer */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">Be Among Our First Users</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                Join our early access program and help shape the future of quote analysis
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <Card className="p-6">
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
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
                  <h3 className="text-lg font-bold">Early Bird Discount</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Get 50% off our premium features for a full year when you join during our launch phase
                  </p>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
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
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Priority Support</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Direct access to our development team and priority feature requests
                  </p>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
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
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Founding Member Status</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Exclusive benefits and recognition as a founding member of our platform
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section - Updated Questions */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">Common Questions</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                Everything you need to know about our early access program
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What makes your AI analysis different?</AccordionTrigger>
                  <AccordionContent>
                    Our AI system is built on cutting-edge machine learning models specifically trained for quote analysis.
                    We focus on accuracy, speed, and providing actionable insights for your business decisions.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What file formats do you support?</AccordionTrigger>
                  <AccordionContent>
                    At launch, we support PDF, Word documents, Excel spreadsheets, and scanned images.
                    Our OCR technology ensures accurate extraction from all supported formats.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How do you protect my data?</AccordionTrigger>
                  <AccordionContent>
                    We implement bank-level encryption and security measures. Your data is encrypted
                    both in transit and at rest, and we adhere to industry security standards.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>What&apos;s included in the early access program?</AccordionTrigger>
                  <AccordionContent>
                    Early access members receive unlimited quote analyses, premium features, priority support,
                    and the ability to influence our product roadmap - all at 50% off for the first year.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section - Updated */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-900 dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center text-white">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Be Part of Something Revolutionary
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-400 md:text-xl">
                  Join our early access program today and help shape the future of quote analysis
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    Join Early Access
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white bg-transparent hover:bg-white hover:text-gray-900 transition-colors"
                  >
                    View Launch Offers
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Create admin user if not exists
  const adminEmail = "admin@quoteai.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const adminUser = existingAdmin || await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin User",
      password: await hash("admin123", 12), // Change this in production
      role: "ADMIN",
    },
  });

  // Create categories
  const techCategory = await prisma.category.create({
    data: {
      name: "Technology",
      slug: "technology",
      description: "Articles about technology and software solutions",
    },
  });

  const accountingCategory = await prisma.category.create({
    data: {
      name: "Accounting",
      slug: "accounting",
      description: "Articles about accounting and financial management",
    },
  });

  // Create tags
  const cloudTag = await prisma.tag.create({
    data: {
      name: "Cloud Software",
      slug: "cloud-software",
    },
  });

  const accountingTag = await prisma.tag.create({
    data: {
      name: "Accounting Software",
      slug: "accounting-software",
    },
  });

  // Create the blog post
  const blogPost = await prisma.blogPost.create({
    data: {
      title: "Most Popular Cloud-based Accounting Software Solutions",
      slug: "most-popular-cloud-based-accounting-software-solutions",
      description: "A comprehensive overview of leading cloud-based accounting software solutions, their benefits, and how they're transforming financial management for businesses.",
      content: `Among the top contenders in this space are QuickBooks Online, Xero, FreshBooks, and Wave. Each platform caters to a diverse range of business sizes and industries. For example, QuickBooks Online is favored by many small to medium-sized enterprises for its robust features and extensive third-party integrations, while Xero is known for its user-friendly interface and strong emphasis on collaboration. FreshBooks has built its reputation by focusing on invoicing and time tracking for freelancers and service-based businesses, and Wave offers a free solution that appeals to startups and small businesses with basic accounting needs.

## Advantages of Cloud-Based Accounting

### 1. Accessibility and Mobility
One of the standout benefits is that these solutions are accessible from any device with an internet connection. This means business owners and finance teams can review financial data, update records, and collaborate in real time, whether they're in the office, at home, or on the go.

### 2. Automatic Updates
Cloud-based systems receive automatic updates, ensuring users always have access to the latest features and security patches without the hassle of manual installations. This helps businesses stay compliant with the latest accounting standards and regulations.

### 3. Cost Efficiency
By eliminating the need for expensive hardware and reducing IT maintenance costs, cloud-based accounting software offers a more affordable solution compared to traditional, on-premise software. Subscription-based pricing models also allow businesses to scale their usage as needed.

### 4. Real-Time Reporting and Collaboration
With data stored securely in the cloud, financial reports are updated in real time. This enables businesses to make informed decisions quickly. Additionally, multiple users can work on the system simultaneously, facilitating seamless collaboration among team members, accountants, and advisors.

### 5. Enhanced Security
Cloud providers invest heavily in security infrastructure, including data encryption and regular backups, to protect sensitive financial information. This level of security is often more robust than what many small businesses can implement on their own.

## Conclusion
As businesses continue to seek agile and efficient financial management solutions, cloud-based accounting software stands out as a modern, secure, and cost-effective option. Whether it's managing day-to-day transactions or preparing for tax season, these platforms offer a suite of tools designed to simplify the accounting process, empowering business owners to focus on growth and innovation. We at QuoteQuake.ai is currently working on the integrations of our software with these accounting software to make live of finance, procurement and cost control departments much easier to analyse the quotes and find savings!`,
      published: true,
      featured: true,
      authorId: adminUser.id,
      categories: {
        connect: [
          { id: techCategory.id },
          { id: accountingCategory.id },
        ],
      },
      tags: {
        connect: [
          { id: cloudTag.id },
          { id: accountingTag.id },
        ],
      },
      readingTime: 5, // Estimated reading time in minutes
    },
  });

  console.log("Blog post created:", blogPost);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
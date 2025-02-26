import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(req: Request) {
  console.log("📧 Contact form submission received");
  
  try {
    const body = await req.json();
    console.log("📧 Request body:", JSON.stringify(body, null, 2));

    // Validate input
    console.log("📧 Validating input data");
    const validatedData = contactSchema.parse(body);
    const { name, email, message } = validatedData;
    console.log("📧 Input validation successful");

    // Verify environment variables
    console.log("📧 Checking environment variables");
    if (!process.env.RESEND_API_KEY) {
      console.error("📧 ERROR: Missing Resend API key");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!process.env.CONTACT_FORM_RECIPIENT) {
      console.error("📧 ERROR: Missing contact form recipient email");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log(`📧 Environment variables verified. Recipient: ${process.env.CONTACT_FORM_RECIPIENT}`);

    // Initialize Resend
    console.log("📧 Initializing Resend client");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Prepare email data
    const emailData = {
      from: "Contact Form <onboarding@resend.dev>",
      to: [process.env.CONTACT_FORM_RECIPIENT],
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">New Contact Form Submission</h2>
  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space: pre-wrap;">${message.replace(/\n/g, "<br>")}</p>
  </div>
</div>
      `,
    };
    
    console.log("📧 Email data prepared:", JSON.stringify({
      from: emailData.from,
      to: emailData.to,
      replyTo: emailData.replyTo,
      subject: emailData.subject,
    }, null, 2));

    // Send email
    console.log("📧 Sending email via Resend");
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("📧 Resend API error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to send email", details: error },
        { status: 500 }
      );
    }

    console.log("📧 Email sent successfully:", JSON.stringify(data, null, 2));
    return NextResponse.json(
      { message: "Email sent successfully", id: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("📧 Failed to send email:", error);
    
    if (error instanceof z.ZodError) {
      console.error("📧 Validation error:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send email", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 
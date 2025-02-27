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
  try {
    const body = await req.json();

    // Validate input
    const validatedData = contactSchema.parse(body);
    const { name, email, message } = validatedData;

    // Verify environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error("Missing Resend API key");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!process.env.CONTACT_FORM_RECIPIENT) {
      console.error("Missing contact form recipient email");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Initialize Resend
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

    // Send email
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("Resend API error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Email sent successfully", id: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send email:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
} 
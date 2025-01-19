# Quote Analyzer Edge Function

This Supabase Edge Function automatically analyzes quotes using Claude AI when new quotes are uploaded to the system.

## Setup

1. Install Supabase CLI if not already installed:

```bash
npm install -g supabase
```

2. Link your project:

```bash
supabase link --project-ref your-project-ref
```

3. Set up environment variables:

```bash
supabase secrets set ANTHROPIC_API_KEY=your-api-key
```

4. Deploy the function:

```bash
supabase functions deploy process-quote
```

5. Create the database trigger:

```sql
-- Create function to call edge function
create function handle_new_quote()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/process-quote',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || auth.role()
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  );
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger
create trigger on_quote_created
  after insert on "Quote"
  for each row
  execute procedure handle_new_quote();
```

## Development

1. Run locally:

```bash
supabase start
supabase functions serve process-quote
```

2. Test the function:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-quote' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"record":{"id":"123","fileUrl":"https://example.com/quote.pdf"}}'
```

## Function Flow

1. Triggered when new quote is created
2. Downloads PDF from Supabase Storage
3. Extracts text from PDF
4. Analyzes text using Claude AI
5. Updates quote record with results

## Error Handling

- Updates quote status to ERROR if processing fails
- Logs errors for debugging
- Maintains transaction safety

## Security

- JWT verification required
- Service role key used for database operations
- Environment variables for sensitive data

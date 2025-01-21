# Quote AI - Construction Quote Fine-tuning

A Python package for fine-tuning GPT models on construction industry quotes data. This tool processes PDF quotes and creates a fine-tuned model that can generate accurate construction quotes based on project specifications.

## Features

- PDF quote extraction and processing
- Structured data extraction for materials, costs, and specifications
- Data cleaning and normalization
- OpenAI GPT model fine-tuning
- Progress monitoring and logging
- Command-line interface for easy usage

## Prerequisites

- Python 3.9 or higher
- Poetry for dependency management
- OpenAI API key

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd quote-ai
```

2. Install dependencies using Poetry:

```bash
poetry install
```

3. Set up environment variables:
   Create a `.env` file in the project root with your OpenAI API key:

```bash
OPENAI_API_KEY=your_api_key_here
```

## Project Structure

```
quote_ai/
├── config/
│   └── config.py         # Configuration settings
├── data/
│   ├── raw/             # Raw PDF quotes
│   └── processed/       # Processed training data
├── models/
│   └── fine_tuner.py    # Fine-tuning implementation
├── utils/
│   └── data_processor.py # Data processing utilities
└── main.py              # CLI entry point
```

## Usage

The package provides three main commands:

1. Process PDF quotes into training data:

```bash
poetry run python -m quote_ai.main process-data --input-dir ./data/raw
```

2. Fine-tune the model using processed data:

```bash
poetry run python -m quote_ai.main fine-tune
```

3. Run the complete pipeline (processing and fine-tuning):

```bash
poetry run python -m quote_ai.main run-pipeline --input-dir ./data/raw
```

### Command Options

- `process-data`:

  - `--input-dir`: Directory containing PDF quote files (required)
  - `--output-file`: Custom output path for processed data (optional)

- `fine-tune`:

  - `--training-file`: Path to the JSONL training data file (optional)

- `run-pipeline`:
  - `--input-dir`: Directory containing PDF quote files (required)
  - `--output-file`: Custom output path for processed data (optional)

## Data Format

### Input PDF Requirements

- PDF files should contain structured quote information
- Each quote should include:
  - Project specifications
  - Material costs
  - Labor costs
  - Total costs

### Training Data Format

The processed training data is stored in JSONL format with the following structure:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a construction quote assistant."
    },
    {
      "role": "user",
      "content": "Project specifications and requirements..."
    },
    {
      "role": "assistant",
      "content": "Detailed quote response..."
    }
  ]
}
```

## Logging

The package maintains detailed logs in `quote_ai.log`, including:

- Data processing progress
- Validation results
- Fine-tuning status
- Error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

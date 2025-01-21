import os
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger
import typer
from typing import Optional

from .utils.data_processor import QuoteDataProcessor
from .utils.drive_downloader import DriveDownloader
from .models.fine_tuner import QuoteFineTuner
from .config.config import DATA_DIR, PROCESSED_DATA_DIR, RAW_DATA_DIR

# Initialize Typer app
app = typer.Typer()


def setup_logging():
    """Configure logging settings."""
    logger.add("quote_ai.log", rotation="500 MB", retention="10 days", level="INFO")


@app.command()
def download_pdfs(
    folder_id: str = typer.Option(
        ..., help="Google Drive folder ID containing PDF files"
    ),
    credentials_path: str = typer.Option(
        ..., help="Path to the Google Drive credentials.json file"
    ),
    output_dir: Optional[str] = typer.Option(
        None, help="Directory to save downloaded PDFs (default: data/raw)"
    ),
):
    """Download PDF files from Google Drive folder."""
    try:
        if output_dir is None:
            output_dir = str(RAW_DATA_DIR)

        output_path = Path(output_dir)
        token_path = Path("token.json")

        # Initialize downloader
        downloader = DriveDownloader(credentials_path, str(token_path))

        # Download files
        logger.info(f"Downloading PDF files from Google Drive folder: {folder_id}")
        downloaded_files = downloader.download_folder(folder_id, output_path)

        logger.info(
            f"Successfully downloaded {len(downloaded_files)} files to {output_path}"
        )

    except Exception as e:
        logger.error(f"Error downloading files: {str(e)}")
        raise typer.Exit(1)


@app.command()
def process_data(
    input_dir: str = typer.Option(..., help="Directory containing PDF quote files"),
    output_file: str = typer.Option(
        str(PROCESSED_DATA_DIR / "training_data.jsonl"),
        help="Output file for processed training data",
    ),
):
    """Process PDF quotes and prepare training data."""
    try:
        processor = QuoteDataProcessor()
        input_path = Path(input_dir)
        output_path = Path(output_file)

        logger.info(f"Processing PDFs from {input_path}")
        training_data = processor.process_pdf_directory(input_path)

        if not training_data:
            logger.error("No valid training examples found")
            raise typer.Exit(1)

        logger.info(f"Found {len(training_data)} valid training examples")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        processor.save_training_data(training_data, output_path)
        logger.info(f"Training data saved to {output_path}")

    except Exception as e:
        logger.error(f"Error processing data: {str(e)}")
        raise typer.Exit(1)


@app.command()
def fine_tune(
    training_file: str = typer.Option(
        str(PROCESSED_DATA_DIR / "training_data.jsonl"),
        help="JSONL file containing training data",
    )
):
    """Fine-tune the model using processed training data."""
    try:
        # Load environment variables
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OPENAI_API_KEY not found in environment variables")
            raise typer.Exit(1)

        training_path = Path(training_file)
        if not training_path.exists():
            logger.error(f"Training file not found: {training_path}")
            raise typer.Exit(1)

        fine_tuner = QuoteFineTuner(api_key)
        result = fine_tuner.fine_tune(training_path)

        if result["status"] == "success":
            logger.info(f"Fine-tuning completed successfully")
            logger.info(f"Fine-tuned model ID: {result['model_id']}")
        else:
            logger.error(f"Fine-tuning failed: {result.get('error', 'Unknown error')}")
            raise typer.Exit(1)

    except Exception as e:
        logger.error(f"Error during fine-tuning: {str(e)}")
        raise typer.Exit(1)


@app.command()
def run_pipeline(
    folder_id: str = typer.Option(
        ..., help="Google Drive folder ID containing PDF files"
    ),
    credentials_path: str = typer.Option(
        ..., help="Path to the Google Drive credentials.json file"
    ),
    output_file: Optional[str] = typer.Option(
        None, help="Output file for processed training data"
    ),
):
    """Run the complete pipeline: download PDFs, process data, and fine-tune model."""
    if output_file is None:
        output_file = str(PROCESSED_DATA_DIR / "training_data.jsonl")

    # Download PDFs
    download_pdfs(folder_id=folder_id, credentials_path=credentials_path)

    # Process data
    process_data(input_dir=str(RAW_DATA_DIR), output_file=output_file)

    # Fine-tune model
    fine_tune(output_file)


if __name__ == "__main__":
    setup_logging()
    app()

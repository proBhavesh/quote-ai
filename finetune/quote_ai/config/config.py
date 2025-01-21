from pathlib import Path
from typing import Dict, Any

# Project paths
ROOT_DIR = Path(__file__).parent.parent.parent
DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "models"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

# Create directories if they don't exist
for dir_path in [DATA_DIR, MODELS_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Training configuration
TRAINING_CONFIG: Dict[str, Any] = {
    "model_name": "gpt-4o",  # Base model to fine-tune
    "train_split": 0.8,  # Training/validation split ratio
    "batch_size": 4,
    "learning_rate": 1e-5,
    "num_epochs": 3,
    "max_tokens": 2048,  # Maximum tokens per example
    "temperature": 0.7,  # Sampling temperature for generation
}

# Data processing configuration
DATA_CONFIG: Dict[str, Any] = {
    "min_quote_length": 50,  # Minimum characters for a valid quote
    "max_quote_length": 4096,  # Maximum characters for a quote
    "currency_symbol": "$",  # Default currency symbol
    "price_decimal_places": 2,  # Number of decimal places for prices
}

# Logging configuration
LOGGING_CONFIG: Dict[str, Any] = {
    "log_level": "INFO",
    "log_file": str(ROOT_DIR / "training.log"),
    "rotation": "1 day",
}

# API configuration
API_CONFIG: Dict[str, Any] = {
    "max_retries": 3,
    "retry_delay": 1,  # seconds
    "timeout": 30,  # seconds
}

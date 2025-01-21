from pathlib import Path
from typing import Dict, Any

# Google Drive API configuration
DRIVE_CONFIG: Dict[str, Any] = {
    "credentials_dir": Path("credentials"),  # Directory to store credentials
    "token_filename": "token.json",  # Default token file name
    "batch_size": 100,  # Number of files to list per page
    "mime_types": {
        "pdf": "application/pdf",
        "doc": "application/vnd.google-apps.document",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    "download_chunk_size": 1024 * 1024,  # 1MB chunks for downloading
    "max_retries": 3,  # Maximum retries for failed downloads
    "retry_delay": 1,  # Delay between retries in seconds
}

# Create credentials directory if it doesn't exist
Path(DRIVE_CONFIG["credentials_dir"]).mkdir(parents=True, exist_ok=True)

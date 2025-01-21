from pathlib import Path
from typing import List, Optional
import os
import time

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from googleapiclient.errors import HttpError
import io
from loguru import logger

from .auth_helper import DriveAuthHelper
from ..config.drive_config import DRIVE_CONFIG


class DriveDownloader:
    """Utility class for downloading files from Google Drive."""

    def __init__(self, credentials_path: str, token_path: Optional[str] = None):
        """Initialize the Drive downloader.

        Args:
            credentials_path: Path to the credentials.json file
            token_path: Path to save/load the token.json file
        """
        self.auth_helper = DriveAuthHelper(credentials_path, token_path)
        self.service = None
        self.mime_types = DRIVE_CONFIG["mime_types"]
        self.batch_size = DRIVE_CONFIG["batch_size"]
        self.max_retries = DRIVE_CONFIG["max_retries"]
        self.retry_delay = DRIVE_CONFIG["retry_delay"]

    def _get_service(self):
        """Get or create Google Drive service."""
        if not self.service:
            creds = self.auth_helper.get_credentials()
            self.service = build("drive", "v3", credentials=creds)
        return self.service

    def list_pdf_files(self, folder_id: str) -> List[dict]:
        """List all PDF files in the specified folder.

        Args:
            folder_id: The ID of the Google Drive folder

        Returns:
            List of dictionaries containing file information
        """
        service = self._get_service()
        files = []
        page_token = None

        while True:
            try:
                # Prepare the query
                query = (
                    f"'{folder_id}' in parents and mimeType='{self.mime_types['pdf']}'"
                )

                # List files in the folder
                results = (
                    service.files()
                    .list(
                        q=query,
                        pageSize=self.batch_size,
                        fields="nextPageToken, files(id, name, mimeType, size)",
                        pageToken=page_token,
                    )
                    .execute()
                )

                files.extend(results.get("files", []))
                page_token = results.get("nextPageToken")

                if not page_token:
                    break

            except HttpError as error:
                logger.error(f"Error listing files: {str(error)}")
                break

        return files

    def download_file(self, file_id: str, output_path: Path) -> Optional[Path]:
        """Download a single file from Drive.

        Args:
            file_id: The ID of the file to download
            output_path: Path where the file should be saved

        Returns:
            Path to the downloaded file if successful, None otherwise
        """
        service = self._get_service()
        retries = 0

        while retries < self.max_retries:
            try:
                request = service.files().get_media(fileId=file_id)
                file = io.BytesIO()
                downloader = MediaIoBaseDownload(
                    file, request, chunksize=DRIVE_CONFIG["download_chunk_size"]
                )

                done = False
                while not done:
                    status, done = downloader.next_chunk()
                    if status:
                        logger.info(
                            f"Download progress: {int(status.progress() * 100)}%"
                        )

                file.seek(0)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                with open(output_path, "wb") as f:
                    f.write(file.read())

                return output_path

            except HttpError as error:
                if error.resp.status in [403, 429]:  # Rate limit or quota exceeded
                    retries += 1
                    if retries < self.max_retries:
                        time.sleep(
                            self.retry_delay * (2**retries)
                        )  # Exponential backoff
                        continue
                logger.error(f"Error downloading file {file_id}: {str(error)}")
                return None

            except Exception as e:
                logger.error(f"Error downloading file {file_id}: {str(e)}")
                return None

    def download_folder(self, folder_id: str, output_dir: Path) -> List[Path]:
        """Download all PDF files from a folder.

        Args:
            folder_id: The ID of the Google Drive folder
            output_dir: Directory to save the downloaded files

        Returns:
            List of paths to the downloaded files
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        downloaded_files = []

        # List all PDF files in the folder
        files = self.list_pdf_files(folder_id)
        total_size = sum(int(f.get("size", 0)) for f in files)
        logger.info(
            f"Found {len(files)} PDF files in the folder (Total size: {total_size / 1024 / 1024:.2f} MB)"
        )

        # Download each file
        for file in files:
            output_path = output_dir / file["name"]
            if output_path.exists():
                logger.info(f"File already exists, skipping: {file['name']}")
                downloaded_files.append(output_path)
                continue

            if self.download_file(file["id"], output_path):
                downloaded_files.append(output_path)
                logger.info(f"Successfully downloaded: {file['name']}")
            else:
                logger.warning(f"Failed to download: {file['name']}")

        return downloaded_files

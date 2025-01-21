from pathlib import Path
import os
from typing import Optional
import time
from loguru import logger

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError

from ..config.drive_config import DRIVE_CONFIG


class DriveAuthHelper:
    """Helper class for Google Drive authentication."""

    def __init__(self, credentials_path: str, token_path: Optional[str] = None):
        """Initialize the auth helper.

        Args:
            credentials_path: Path to the credentials.json file
            token_path: Path to save/load the token.json file. If None, uses default from config.
        """
        self.credentials_path = Path(credentials_path)
        self.token_path = (
            Path(token_path)
            if token_path
            else (DRIVE_CONFIG["credentials_dir"] / DRIVE_CONFIG["token_filename"])
        )
        self.scopes = ["https://www.googleapis.com/auth/drive.readonly"]

    def get_credentials(self) -> Credentials:
        """Get valid credentials, refreshing or creating new ones if necessary.

        Returns:
            Valid Google OAuth2 credentials
        """
        creds = None

        # Try to load existing token
        if self.token_path.exists():
            try:
                creds = Credentials.from_authorized_user_file(
                    str(self.token_path), self.scopes
                )
            except Exception as e:
                logger.warning(f"Error loading existing token: {str(e)}")

        # If no valid credentials available, get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except RefreshError:
                    logger.warning(
                        "Token refresh failed, initiating new authentication flow"
                    )
                    creds = self._create_new_credentials()
            else:
                creds = self._create_new_credentials()

            # Save the credentials
            self._save_credentials(creds)

        return creds

    def _create_new_credentials(self) -> Credentials:
        """Create new credentials through OAuth2 flow.

        Returns:
            New Google OAuth2 credentials
        """
        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                str(self.credentials_path), self.scopes
            )
            creds = flow.run_local_server(port=0)
            return creds
        except Exception as e:
            logger.error(f"Error creating new credentials: {str(e)}")
            raise

    def _save_credentials(self, creds: Credentials) -> None:
        """Save credentials to token file.

        Args:
            creds: The credentials to save
        """
        try:
            # Ensure directory exists
            self.token_path.parent.mkdir(parents=True, exist_ok=True)

            # Save credentials
            with open(self.token_path, "w") as token:
                token.write(creds.to_json())

            logger.info(f"Credentials saved to {self.token_path}")

        except Exception as e:
            logger.error(f"Error saving credentials: {str(e)}")
            raise

    def revoke_credentials(self) -> None:
        """Revoke the current credentials and delete the token file."""
        if self.token_path.exists():
            try:
                creds = Credentials.from_authorized_user_file(
                    str(self.token_path), self.scopes
                )
                if creds and creds.valid:
                    # Revoke credentials
                    Request().session.close()

                # Delete token file
                self.token_path.unlink()
                logger.info("Credentials revoked and token file deleted")

            except Exception as e:
                logger.error(f"Error revoking credentials: {str(e)}")
                raise

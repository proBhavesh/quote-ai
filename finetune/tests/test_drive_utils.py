import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError

from quote_ai.utils.auth_helper import DriveAuthHelper
from quote_ai.utils.drive_downloader import DriveDownloader
from quote_ai.config.drive_config import DRIVE_CONFIG


@pytest.fixture
def mock_credentials():
    creds = Mock(spec=Credentials)
    creds.valid = True
    creds.expired = False
    return creds


@pytest.fixture
def mock_service():
    service = MagicMock()
    return service


@pytest.fixture
def auth_helper(tmp_path):
    credentials_path = tmp_path / "credentials.json"
    token_path = tmp_path / "token.json"
    return DriveAuthHelper(str(credentials_path), str(token_path))


@pytest.fixture
def drive_downloader(tmp_path):
    credentials_path = tmp_path / "credentials.json"
    token_path = tmp_path / "token.json"
    return DriveDownloader(str(credentials_path), str(token_path))


def test_auth_helper_init(auth_helper):
    """Test DriveAuthHelper initialization."""
    assert auth_helper.scopes == ["https://www.googleapis.com/auth/drive.readonly"]
    assert isinstance(auth_helper.credentials_path, Path)
    assert isinstance(auth_helper.token_path, Path)


@patch("quote_ai.utils.auth_helper.Credentials")
def test_auth_helper_load_existing_token(
    mock_credentials_class, auth_helper, mock_credentials, tmp_path
):
    """Test loading existing token."""
    # Create mock token file
    token_path = tmp_path / "token.json"
    token_path.write_text('{"token": "test"}')

    mock_credentials_class.from_authorized_user_file.return_value = mock_credentials
    auth_helper.token_path = token_path

    creds = auth_helper.get_credentials()
    assert creds == mock_credentials
    mock_credentials_class.from_authorized_user_file.assert_called_once()


@patch("quote_ai.utils.auth_helper.InstalledAppFlow")
def test_auth_helper_create_new_credentials(mock_flow, auth_helper, mock_credentials):
    """Test creating new credentials."""
    mock_flow_instance = Mock()
    mock_flow_instance.run_local_server.return_value = mock_credentials
    mock_flow.from_client_secrets_file.return_value = mock_flow_instance

    creds = auth_helper._create_new_credentials()
    assert creds == mock_credentials
    mock_flow.from_client_secrets_file.assert_called_once()


@patch("quote_ai.utils.drive_downloader.build")
def test_drive_downloader_list_files(mock_build, drive_downloader, mock_service):
    """Test listing PDF files."""
    # Mock the Drive API service
    mock_build.return_value = mock_service

    # Mock the files().list() response
    mock_response = {
        "files": [
            {
                "id": "123",
                "name": "test1.pdf",
                "mimeType": "application/pdf",
                "size": "1000",
            },
            {
                "id": "456",
                "name": "test2.pdf",
                "mimeType": "application/pdf",
                "size": "2000",
            },
        ]
    }
    mock_service.files().list().execute.return_value = mock_response

    files = drive_downloader.list_pdf_files("folder_id")
    assert len(files) == 2
    assert files[0]["name"] == "test1.pdf"
    assert files[1]["name"] == "test2.pdf"


@patch("quote_ai.utils.drive_downloader.MediaIoBaseDownload")
@patch("quote_ai.utils.drive_downloader.build")
def test_drive_downloader_download_file(
    mock_build, mock_downloader, drive_downloader, mock_service, tmp_path
):
    """Test downloading a single file."""
    # Mock the Drive API service
    mock_build.return_value = mock_service

    # Mock the download process
    mock_downloader_instance = Mock()
    mock_downloader_instance.next_chunk.side_effect = [
        (Mock(progress=lambda: 0.5), False),
        (Mock(progress=lambda: 1.0), True),
    ]
    mock_downloader.return_value = mock_downloader_instance

    output_path = tmp_path / "test.pdf"
    result = drive_downloader.download_file("file_id", output_path)

    assert result == output_path
    assert output_path.exists()
    mock_service.files().get_media.assert_called_once()


@patch("quote_ai.utils.drive_downloader.build")
def test_drive_downloader_handle_rate_limit(mock_build, drive_downloader, mock_service):
    """Test handling rate limit errors."""
    # Mock the Drive API service
    mock_build.return_value = mock_service

    # Mock rate limit error
    error_response = Mock()
    error_response.status = 429
    mock_service.files().get_media.side_effect = HttpError(
        error_response, b"Rate limit exceeded"
    )

    result = drive_downloader.download_file("file_id", Path("test.pdf"))
    assert result is None
    assert mock_service.files().get_media.call_count == drive_downloader.max_retries


def test_drive_downloader_skip_existing(drive_downloader, tmp_path):
    """Test skipping existing files during folder download."""
    # Create an existing file
    existing_file = tmp_path / "existing.pdf"
    existing_file.touch()

    with patch.object(drive_downloader, "list_pdf_files") as mock_list:
        mock_list.return_value = [{"id": "123", "name": "existing.pdf"}]

        downloaded = drive_downloader.download_folder("folder_id", tmp_path)
        assert len(downloaded) == 1
        assert downloaded[0] == existing_file
        # Verify download_file was not called for existing file
        assert not hasattr(drive_downloader, "_download_file_called")

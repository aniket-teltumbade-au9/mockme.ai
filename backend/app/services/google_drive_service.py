import json
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

class GoogleDriveService:
    def __init__(self, refresh_token: str):
        self.refresh_token = refresh_token
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        
        # Construct credentials from refresh token
        self.creds = Credentials(
            token=None, 
            refresh_token=refresh_token,
            client_id=self.client_id,
            client_secret=self.client_secret,
            token_uri="https://oauth2.googleapis.com/token"
        )
        self.service = build('drive', 'v3', credentials=self.creds)

    def _get_shared_link(self, file_id: str) -> str:
        """Make a file public and return the webViewLink."""
        permission = {
            'role': 'reader',
            'type': 'anyone',
        }
        self.service.permissions().create(
            fileId=file_id,
            body=permission,
            fields='id'
        ).execute()
        
        file = self.service.files().get(
            fileId=file_id, 
            fields='webViewLink'
        ).execute()
        
        return file.get('webViewLink')

    def upload_resume(self, session_id: str, filename: str, resume_bytes: bytes) -> str:
        """Upload a resume to Google Drive and return the shared link."""
        # Ensure folder exists or just upload to root for now
        file_metadata = {
            'name': f"MockMe_{session_id}_{filename}",
            'mimeType': 'application/pdf'
        }
        media = MediaIoBaseUpload(io.BytesIO(resume_bytes), mimetype='application/pdf')
        
        file = self.service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        
        return self._get_shared_link(file.get('id'))

    def upload_interview(
        self,
        session_id: str,
        date_str: str,
        audio_bytes: bytes,
        analysis_data: dict,
    ) -> tuple[str, str]:
        # 1. Upload Audio
        audio_metadata = {
            'name': f"MockMe_{date_str}_{session_id}_audio.webm",
            'mimeType': 'audio/webm'
        }
        audio_media = MediaIoBaseUpload(io.BytesIO(audio_bytes), mimetype='audio/webm')
        audio_file = self.service.files().create(
            body=audio_metadata,
            media_body=audio_media,
            fields='id'
        ).execute()
        audio_link = self._get_shared_link(audio_file.get('id'))

        # 2. Upload Analysis JSON
        json_bytes = json.dumps(analysis_data, indent=2, default=str).encode("utf-8")
        json_metadata = {
            'name': f"MockMe_{date_str}_{session_id}_analysis.json",
            'mimeType': 'application/json'
        }
        json_media = MediaIoBaseUpload(io.BytesIO(json_bytes), mimetype='application/json')
        json_file = self.service.files().create(
            body=json_metadata,
            media_body=json_media,
            fields='id'
        ).execute()
        json_link = self._get_shared_link(json_file.get('id'))

        return audio_link, json_link

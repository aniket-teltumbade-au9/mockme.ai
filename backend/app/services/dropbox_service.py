import json
import dropbox
import dropbox.exceptions
import dropbox.files
import dropbox.sharing
import os


class DropboxService:
    def __init__(self, refresh_token: str):
        self.app_key = os.getenv("DROPBOX_APP_KEY")
        self.app_secret = os.getenv("DROPBOX_APP_SECRET")
        self.dbx = dropbox.Dropbox(
            oauth2_refresh_token=refresh_token,
            app_key=self.app_key,
            app_secret=self.app_secret,
        )

    def _get_or_create_shared_link(self, path: str) -> str:
        """Create a shared link, or fetch the existing one if it already exists."""
        try:
            res = self.dbx.sharing_create_shared_link_with_settings(path)
            return res.url
        except dropbox.exceptions.ApiError as e:
            # SharedLinkAlreadyExists — fetch the existing link
            if (
                e.error.is_shared_link_already_exists()
                if hasattr(e.error, "is_shared_link_already_exists")
                else "shared_link_already_exists" in str(e).lower()
            ):
                links = self.dbx.sharing_list_shared_links(path=path, direct_only=True)
                if links.links:
                    return links.links[0].url
                raise RuntimeError(f"Could not retrieve shared link for {path}") from e
            raise

    def upload_interview(
        self,
        session_id: str,
        date_str: str,
        audio_bytes: bytes,
        analysis_data: dict,
    ) -> tuple[str, str]:
        base_path = f"/MockMe.AI/interviews/{date_str}_{session_id}"

        audio_path = f"{base_path}/audio.webm"
        self.dbx.files_upload(
            audio_bytes,
            audio_path,
            mode=dropbox.files.WriteMode.overwrite,
        )

        json_path = f"{base_path}/analysis.json"
        json_bytes = json.dumps(analysis_data, indent=2, default=str).encode("utf-8")
        self.dbx.files_upload(
            json_bytes,
            json_path,
            mode=dropbox.files.WriteMode.overwrite,
        )

        audio_link = self._get_or_create_shared_link(audio_path)
        json_link = self._get_or_create_shared_link(json_path)

        return audio_link, json_link

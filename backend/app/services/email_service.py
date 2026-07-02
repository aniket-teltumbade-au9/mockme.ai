import logging
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger(__name__)


async def send_email_notification(user: dict, bonus_amount: int) -> bool:
    """
    Sends an email notification to a user about their festival bonus.
    
    Extracts email from user document (prioritize: email → google_account_email → dropbox_account_email).
    Logs warning if no email found. Sends email with subject and body including bonus amount and new balance.
    
    Args:
        user: User document from database containing email fields
        bonus_amount: Amount of bonus credits awarded
        
    Returns:
        True if email sent successfully, False otherwise
    """
    # Extract email with priority: email > google_account_email > dropbox_account_email
    email = user.get("email") or user.get("google_account_email") or user.get("dropbox_account_email")
    
    if not email:
        logger.warning(f"No email found for user {user.get('user_id')}")
        return False
    
    # Calculate new balance
    current_credits = user.get("credits", 0)
    new_balance = current_credits + bonus_amount
    
    subject = f"🎉 Festival Bonus: +{bonus_amount} Credits!"
    body = f"""
Congratulations! You've received {bonus_amount} bonus credits!
Your new balance: {new_balance} credits
Use them to practice your next interview.
"""
    
    success = await send_email(email, subject, body)
    
    if not success:
        logger.error(f"Failed to send email notification to {email} for user {user.get('user_id')}")
    
    return success


async def send_email(email: str, subject: str, body: str) -> bool:
    """
    Sends an email using SMTP or email service integration.
    
    Args:
        email: Recipient email address
        subject: Email subject line
        body: Email body content
        
    Returns:
        True if email sent successfully, False otherwise
    """
    try:
        # Get SMTP configuration from environment
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        sender_email = os.getenv("SENDER_EMAIL", smtp_user or "noreply@mockme.com")
        
        # If SMTP credentials are not configured, log and return False
        if not smtp_user or not smtp_password:
            logger.warning(f"SMTP credentials not configured. Email to {email} not sent.")
            return False
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = email
        
        # Add plain text part
        text_part = MIMEText(body, "plain")
        message.attach(text_part)
        
        # Send email via SMTP
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(sender_email, email, message.as_string())
        
        logger.info(f"Email sent successfully to {email}")
        return True
        
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error while sending email to {email}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error sending email to {email}: {str(e)}")
        return False

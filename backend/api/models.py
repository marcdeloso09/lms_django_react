from django.db import models
from django.contrib.auth.models import User

class UserBehavior(models.Model):
    ACTION_CHOICES = [
        ("Normal", "Normal"),
        ("Normal Layout", "Normal Layout"),
        ("Slow Scroll Detected", "Slow Scroll Detected"),
        ("Hovering over classes", "Hovering over classes"),
        ("Focus View", "Focus View"),
        ("Click Error Mode", "Click Error Mode"),
        ("UI Dimmed", "UI Dimmed"),
        ("UI Restored (User Idle)", "UI Restored (User Idle)"),
        ("Enlarge Mode", "Enlarge Mode"),
        ("Account Created", "Account Created"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="behaviors")
    participant_id = models.CharField(max_length=10)
    scroll_velocity = models.FloatField()
    hover_duration = models.CharField(max_length=10)  # "3s"
    click_error_rate = models.FloatField()
    focus_mode = models.CharField(max_length=10)  # "Active" / "Inactive"
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.participant_id} | {self.scroll_velocity} | {self.hover_duration} | {self.click_error_rate}"
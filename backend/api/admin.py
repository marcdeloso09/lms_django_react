from django.contrib import admin
from .models import UserBehavior

@admin.register(UserBehavior)
class UserBehaviorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "participant_id",
        "scroll_velocity",
        "hover_duration",
        "click_error_rate",
        "focus_mode",
        "action",
        "timestamp",
    )
    list_filter = ("action", "focus_mode", "timestamp")
    search_fields = ("participant_id", "user__username", "action")

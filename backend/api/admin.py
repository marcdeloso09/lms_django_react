from django.contrib import admin
from django.http import HttpResponse
import csv
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
    actions = ["export_as_csv"]

    def export_as_csv(self, request, queryset):
        """Custom admin action to export selected rows as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=behaviors.csv'
        writer = csv.writer(response)
        
        # Header
        writer.writerow([
            "User", "Participant ID", "Scroll Velocity", "Hover Duration",
            "Click Error Rate", "Focus Mode", "Action", "Timestamp"
        ])

        # Data rows
        for behavior in queryset:
            writer.writerow([
                behavior.user.username,
                behavior.participant_id,
                behavior.scroll_velocity,
                behavior.hover_duration,
                behavior.click_error_rate,
                behavior.focus_mode,
                behavior.action,
                behavior.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            ])

        return response

    export_as_csv.short_description = "Export selected behaviors to CSV"

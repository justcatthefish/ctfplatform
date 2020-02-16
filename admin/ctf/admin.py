from django.contrib import admin
from .models import Announcement, Audit, Task, TaskFlags, Team


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'description', 'created_at')


@admin.register(Audit)
class AuditAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'team', 'created_at')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'difficult', 'started_at', 'created_at')


@admin.register(TaskFlags)
class TaskFlagsAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'flag')


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'active', 'country', 'created_at')

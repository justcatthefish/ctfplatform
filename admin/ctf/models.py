from django.db import models


class Announcement(models.Model):
    title = models.CharField(max_length=255, null=False, blank=False)
    description = models.TextField(null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True, null=False)

    def __str__(self):
        return f'{self.title} (#{self.id})'

    class Meta:
        db_table = 'announcement'
        managed = False


class Task(models.Model):
    name = models.CharField(max_length=255, null=False)
    description = models.TextField(null=False)
    category = models.CharField(max_length=128, null=False)
    difficult = models.CharField(max_length=32, null=False)
    started_at = models.DateTimeField(null=True, default=None, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=False)

    def __str__(self):
        return f'{self.name} (#{self.id})'

    class Meta:
        db_table = 'task'
        managed = False


class TaskFlags(models.Model):
    task = models.ForeignKey('Task', on_delete=models.DO_NOTHING, null=False, related_name='+')
    flag = models.CharField(max_length=255, unique=True, null=False)

    class Meta:
        db_table = 'task_flags'
        managed = False


class Team(models.Model):
    name = models.CharField(max_length=255, unique=True, null=False, blank=False)
    email = models.CharField(max_length=255, unique=True, null=False, blank=False)
    password = models.CharField(max_length=255, null=False)
    active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=False)

    country = models.CharField(max_length=4, null=False, blank=True)
    avatar = models.CharField(max_length=64, null=False, blank=True)
    affiliation = models.CharField(max_length=64, null=False, blank=True)
    website = models.CharField(max_length=255, null=False, blank=True)

    def __str__(self):
        return f'{self.name} (#{self.id})'

    class Meta:
        db_table = 'team'
        managed = False


class TeamAvatar(models.Model):
    team_id = models.ForeignKey('Team', unique=True, on_delete=models.CASCADE, null=False, related_name='+')
    avatar_path = models.CharField(max_length=64, null=False)
    avatar = models.BinaryField(null=False)


class Audit(models.Model):
    task = models.ForeignKey('Task', on_delete=models.DO_NOTHING, null=False, related_name='+')
    team = models.ForeignKey('Team', on_delete=models.DO_NOTHING, null=False, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True, null=False)

    class Meta:
        db_table = 'audit'
        unique_together = (('task', 'team'),)
        managed = False
